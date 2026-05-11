/**
 * Traffic Monitoring System - Type Definitions
 * NEW CONCEPT: Queue Level Based System
 */

// Queue Level: 0 (short), 1 (medium), 2 (long)
export type QueueLevel = 0 | 1 | 2;

// Traffic Light Status
export type LightStatus = 'red' | 'yellow' | 'green';

// IR Sensor State
export type IRState = 'detected' | 'clear';

/**
 * Lane Data Structure (NEW CONCEPT)
 * - Vehicle counting happens in ALL light conditions
 * - Green duration based on queue level, not vehicle count
 */
export interface LaneData {
  light: LightStatus;              // Current traffic light status
  vehicleCount: number;            // Count in all conditions (not just red)
  irState: IRState;                // IR sensor detection state
  queueLength: number;             // Distance from ultrasonic sensor (cm)
  queueLevel: QueueLevel;          // 0: >20cm, 1: 10-20cm, 2: <10cm
  greenDuration: number;           // Actual duration used (7, 10, or 15 seconds)
}

/**
 * Traffic Data from IoT Device (NEW CONCEPT)
 */
export interface TrafficDataPayload {
  deviceId: string;
  timestamp: number;
  north: LaneData;
  south: LaneData;
  east: LaneData;
  west: LaneData;
}

/**
 * Traffic Data Item in Database (NEW CONCEPT)
 */
export interface TrafficDataItem {
  id: string;
  intersectionId: string;
  deviceId: string;
  lane: 'north' | 'south' | 'east' | 'west';
  light: LightStatus;
  vehicleCount: number;
  irState: IRState;
  queueLength: number;
  queueLevel: QueueLevel;
  greenDuration: 7 | 10 | 15;      // Only valid values
  speed?: number;
  density?: number;
  status: string;
  timestamp: string;
  _ts: number;
}

/**
 * Queue Level Mapping
 */
export const QUEUE_LEVEL_CONFIG = {
  0: {
    name: 'Antrian Pendek',
    minDistance: 20,               // > 20cm
    maxDistance: Infinity,
    greenDuration: 7,              // 7 seconds
    color: 'green',
    indicator: '🟢',
  },
  1: {
    name: 'Antrian Sedang',
    minDistance: 10,               // 10-20cm
    maxDistance: 20,
    greenDuration: 10,             // 10 seconds
    color: 'yellow',
    indicator: '🟡',
  },
  2: {
    name: 'Antrian Panjang',
    minDistance: 0,                // < 10cm
    maxDistance: 10,
    greenDuration: 15,             // 15 seconds
    color: 'red',
    indicator: '🔴',
  },
} as const;

/**
 * Helper function to determine queue level from distance
 */
export function getQueueLevelFromDistance(distance: number): QueueLevel {
  if (distance > 20) return 0;
  if (distance >= 10) return 1;
  return 2;
}

/**
 * Helper function to get green duration from queue level
 */
export function getGreenDurationFromQueueLevel(queueLevel: QueueLevel): 7 | 10 | 15 {
  return QUEUE_LEVEL_CONFIG[queueLevel].greenDuration as 7 | 10 | 15;
}

/**
 * Validate traffic data payload
 */
export function validateTrafficData(data: Partial<TrafficDataItem>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!data.deviceId) errors.push('deviceId is required');
  if (!data.lane) errors.push('lane is required');

  // Queue level validation
  if (data.queueLevel !== undefined && ![0, 1, 2].includes(data.queueLevel)) {
    errors.push('queueLevel must be 0, 1, or 2');
  }

  // Queue length validation
  if (data.queueLength !== undefined && data.queueLength < 0) {
    errors.push('queueLength must be >= 0');
  }

  // Green duration validation
  if (data.greenDuration !== undefined && ![7, 10, 15].includes(data.greenDuration)) {
    errors.push('greenDuration must be 7, 10, or 15 seconds');
  }

  // Light status validation
  if (data.light && !['red', 'yellow', 'green'].includes(data.light)) {
    errors.push('light must be red, yellow, or green');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
