"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "@/providers/TranslationProvider";

interface DeviceOption {
  device_id: string;
  deviceId: string;

  intersection_id?: string | null;
  intersectionId?: string | null;

  status: "online" | "offline";
  last_seen?: string | null;
  lastSeen?: string | null;

  wifi_rssi?: number | null;
  uptime_s?: number | null;
}

interface ModalTambahPersimpanganProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface IntersectionFormData {
  name: string;
  address: string;

  latitude: string;
  longitude: string;

  intersectionId: string;
  deviceId: string;

  status: "active" | "maintenance" | "inactive";
  configMode: "auto" | "manual";

  lanesCount: string;
  lanesDirections: string[];
}

const INITIAL_FORM: IntersectionFormData = {
  name: "",
  address: "",

  latitude: "",
  longitude: "",

  intersectionId: "",
  deviceId: "",

  status: "active",
  configMode: "auto",

  // Firmware ESP32 saat ini memiliki north, south, east.
  lanesCount: "3",
  lanesDirections: ["north", "south", "east"],
};

function getDirectionsByLaneCount(count: number): string[] {
  if (count <= 3) {
    return ["north", "south", "east"];
  }

  if (count === 4) {
    return ["north", "east", "south", "west"];
  }

  if (count === 5) {
    return ["north", "north-east", "east", "south", "west"];
  }

  return ["north", "north-east", "east", "south", "south-west", "west"];
}

function formatLastSeen(value?: string | null): string {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("id-ID");
}

export default function ModalTambahPersimpangan({
  isOpen,
  onClose,
  onSuccess,
}: ModalTambahPersimpanganProps) {
  const { t } = useTranslation();
  const [formData, setFormData] =
    useState<IntersectionFormData>(INITIAL_FORM);

  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [usedDeviceIds, setUsedDeviceIds] = useState<string[]>([]);

  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [deviceLoadError, setDeviceLoadError] = useState("");

  const [manualDeviceMode, setManualDeviceMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDevices = useMemo(() => {
    return devices.filter((device) => {
      const deviceId = device.device_id || device.deviceId;

      return deviceId && !usedDeviceIds.includes(deviceId);
    });
  }, [devices, usedDeviceIds]);

  const selectedDevice = useMemo(() => {
    return devices.find((device) => {
      const deviceId = device.device_id || device.deviceId;

      return deviceId === formData.deviceId;
    });
  }, [devices, formData.deviceId]);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setManualDeviceMode(false);
    setDeviceLoadError("");
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const loadDevices = async () => {
    setIsLoadingDevices(true);
    setDeviceLoadError("");

    try {
      const [devicesResponse, intersectionsResponse] = await Promise.all([
        fetch("/api/devices/status", {
          cache: "no-store",
        }),
        fetch("/api/intersections", {
          cache: "no-store",
        }),
      ]);

      const devicesJson = await devicesResponse.json();
      const intersectionsJson = await intersectionsResponse.json();

      if (!devicesResponse.ok || devicesJson.success === false) {
        throw new Error(
          devicesJson.error || t('errors.fetchDevices')
        );
      }

      const loadedDevices: DeviceOption[] =
        devicesJson.data || devicesJson.devices || [];

      const intersections =
        intersectionsResponse.ok && intersectionsJson.success
          ? intersectionsJson.data || []
          : [];

      const usedIds = intersections
        .map((intersection: any) => {
          return intersection.device_id || intersection.deviceId;
        })
        .filter(Boolean);

      setDevices(loadedDevices);
      setUsedDeviceIds(usedIds);
    } catch (error: any) {
      console.error("Error loading devices:", error);

      setDevices([]);
      setUsedDeviceIds([]);

      setDeviceLoadError(
        error.message || t('errors.fetchDevices')
      );
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm();
    loadDevices();
  }, [isOpen]);

  const handleTextChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    if (name === "lanesCount") {
      const laneCount = Number(value);

      setFormData((current) => ({
        ...current,
        lanesCount: value,
        lanesDirections: getDirectionsByLaneCount(laneCount),
      }));

      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleDeviceSelection = (deviceId: string) => {
    const device = devices.find((item) => {
      const currentDeviceId = item.device_id || item.deviceId;

      return currentDeviceId === deviceId;
    });

    const intersectionId =
      device?.intersection_id || device?.intersectionId || "";

    setFormData((current) => ({
      ...current,
      deviceId,
      intersectionId,
    }));
  };

  const handleManualModeChange = () => {
    setManualDeviceMode((current) => {
      const nextValue = !current;

      setFormData((form) => ({
        ...form,
        deviceId: "",
        intersectionId: "",
      }));

      return nextValue;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = formData.name.trim();
    const address = formData.address.trim();
    const deviceId = formData.deviceId.trim();
    const intersectionId = formData.intersectionId.trim();

    if (!name) {
      toast.error(t('intersections.name') + ' ' + t('common.error'));
      return;
    }

    if (!address) {
      toast.error(t('intersections.address') + ' ' + t('common.error'));
      return;
    }

    if (!deviceId) {
      toast.error(t('iot.deviceId') + ' ' + t('common.error'));
      return;
    }

    if (!intersectionId) {
      toast.error(t('modals.intersectionIdRequired') + ' ' + t('common.error'));
      return;
    }

    if (!manualDeviceMode) {
      const device = devices.find((item) => {
        return (item.device_id || item.deviceId) === deviceId;
      });

      if (!device) {
        toast.error(t('errors.fetchDevices'));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        id: intersectionId,

        intersection_id: intersectionId,
        intersectionId,

        name,
        address,

        latitude: Number.parseFloat(formData.latitude) || 0,
        longitude: Number.parseFloat(formData.longitude) || 0,

        device_id: deviceId,
        deviceId,

        status: formData.status,

        lanes: {
          count: Number.parseInt(formData.lanesCount, 10),
          directions: formData.lanesDirections,
        },

        lanesCount: Number.parseInt(formData.lanesCount, 10),
        lanesDirections: formData.lanesDirections,

        config: {
          mode: formData.configMode,
        },

        configMode: formData.configMode,
      };

      const response = await fetch("/api/intersections", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error || t('intersections.addSuccess')
        );
      }

      toast.success(t('intersections.addSuccess'));

      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding intersection:", error);

      toast.error(
        error.message || t('errors.general')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 20,
            }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5 text-white lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold lg:text-2xl">
                    {t('modals.addIntersection')}
                  </h3>

                  <p className="mt-1 text-sm text-white/80">
                    {t('modals.addIntersectionDesc')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-full p-2 transition-colors hover:bg-white/20 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">
                    close
                  </span>
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(92vh-110px)] overflow-y-auto p-5 lg:p-6"
            >
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {t('intersections.name')}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleTextChange}
                    required
                    placeholder={t('intersections.name')}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {t('intersections.address')} <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleTextChange}
                    required
                    placeholder={t('intersections.address')}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {t('intersections.latitude')}
                    </label>

                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleTextChange}
                      placeholder="-7.978"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {t('intersections.longitude')}
                    </label>

                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleTextChange}
                      placeholder="112.630"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">
                        {t('iot.deviceId')} <span className="text-red-500">*</span>
                      </label>

                      <p className="mt-1 text-xs text-slate-500">
                        {t('modals.deviceTakenFromDynamoDB')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualModeChange}
                      className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      {manualDeviceMode
                        ? t('modals.selectDetectedDevice')
                        : t('modals.enterManual')}
                    </button>
                  </div>

                  {manualDeviceMode ? (
                    <input
                      type="text"
                      name="deviceId"
                      value={formData.deviceId}
                      onChange={handleTextChange}
                      required
                      placeholder="ESP32_TRAFFIC_01"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                    />
                  ) : (
                    <select
                      name="deviceId"
                      value={formData.deviceId}
                      onChange={(event) =>
                        handleDeviceSelection(event.target.value)
                      }
                      required
                      disabled={isLoadingDevices}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                    >
                      <option value="">
                        {isLoadingDevices
                          ? t('modals.loadingDevices')
                          : t('modals.selectDetectedDevicePlaceholder')}
                      </option>

                      {availableDevices.map((device) => {
                        const deviceId =
                          device.device_id || device.deviceId;

                        const intersectionId =
                          device.intersection_id ||
                          device.intersectionId ||
                          "N/A";

                        return (
                          <option key={deviceId} value={deviceId}>
                            {deviceId} — {device.status} — {intersectionId}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      {availableDevices.length} {t('modals.devicesAvailable')}
                    </p>

                    <button
                      type="button"
                      onClick={loadDevices}
                      disabled={isLoadingDevices}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">
                        refresh
                      </span>
                      {t('modals.reload')}
                    </button>
                  </div>

                  {deviceLoadError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs text-red-700">
                        {deviceLoadError}
                      </p>
                    </div>
                  )}

                  {!isLoadingDevices &&
                    !deviceLoadError &&
                    availableDevices.length === 0 &&
                    !manualDeviceMode && (
                      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                        <p className="text-xs text-amber-800">
                          {t('modals.noDevicesAvailable')}
                        </p>
                      </div>
                    )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {t('modals.intersectionIdRequired')}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="intersectionId"
                    value={formData.intersectionId}
                    onChange={handleTextChange}
                    readOnly={!manualDeviceMode}
                    required
                    placeholder={t('modals.autoFollowsESP32')}
                    className={`w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600 ${
                      !manualDeviceMode
                        ? "cursor-not-allowed bg-slate-100 text-slate-600"
                        : "bg-white"
                    }`}
                  />

                  {!manualDeviceMode && selectedDevice && (
                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        <p className="text-blue-800">
                          {t('intersections.status')}:{" "}
                          <span className="font-bold">
                            {selectedDevice.status}
                          </span>
                        </p>

                        <p className="text-blue-800">
                          {t('iot.lastSeen')}:{" "}
                          <span className="font-bold">
                            {formatLastSeen(
                              selectedDevice.last_seen ||
                                selectedDevice.lastSeen
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {t('intersections.status')}
                    </label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleTextChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="active">{t('intersections.active')}</option>
                      <option value="maintenance">{t('intersections.maintenance')}</option>
                      <option value="inactive">{t('intersections.inactive')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {t('modals.operatingMode')}
                    </label>

                    <select
                      name="configMode"
                      value={formData.configMode}
                      onChange={handleTextChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="auto">{t('trafficControl.autoMode')}</option>
                      <option value="manual">{t('trafficControl.manualMode')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {t('modals.lanesCount')}
                  </label>

                  <select
                    name="lanesCount"
                    value={formData.lanesCount}
                    onChange={handleTextChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="3">3 {t('modals.lanes')}</option>
                    <option value="4">4 {t('modals.lanes')}</option>
                    <option value="5">5 {t('modals.lanes')}</option>
                    <option value="6">6 {t('modals.lanes')}</option>
                  </select>

                  <p className="mt-2 text-xs text-slate-500">
                    {t('modals.lanesDirections')}: {formData.lanesDirections.join(", ")}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-xl text-blue-600">
                      info
                    </span>

                    <div>
                      <p className="text-sm font-bold text-blue-900">
                        {t('common.info')}
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-blue-700">
                        {t('modals.deviceInfo')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 px-6 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (!manualDeviceMode && availableDevices.length === 0)
                  }
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t('modals.saving')}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">
                        add
                      </span>
                      {t('modals.addIntersection')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}