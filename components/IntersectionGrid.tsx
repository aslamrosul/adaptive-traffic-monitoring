"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const intersections = [
  {
    id: 1,
    name: "Simpangan Sarinah",
    status: "PADAT",
    statusColor: "bg-tertiary-container text-on-tertiary-container",
    waitTime: "78s",
    volume: "450 unit/jam",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmCrZVBq43v-Xzkpi-qDLzMxaXBOjOHdXdkajAHJScI__Ia7LS8K-vZxGaNP_KmnbRnoEHNGzGYheTYbNM7SmZZhuzuvdDg9Hz7hw6QHAfpTXWHk0zIQa8kXzax6ObjZknU4CCqp8wF5L7Mo5mPZfS6F9otNTGWWNJnwpfRhRAguBuqu2TJzP9RnSKqAYuW9-LGHcHLELhy1OLizwDYcl4TqRtbj9Y_PdG4teSbot9zRn_EMs01VO3CoB1r1iS74o2WwgFiJ_5vfk",
  },
  {
    id: 2,
    name: "Bundaran HI",
    status: "LANCAR",
    statusColor: "bg-on-primary-container text-primary-fixed",
    waitTime: "32s",
    volume: "320 unit/jam",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFCOlgltGSxhYqO6HZtF6geZTvkPhkst5-NExeYD_RHGCMzcDNsLoUetmpV9VjY1TEC2JtIVdkUXHdfhdHyN44mcmRuriPhlaCKRlB2theiLTsnppUsbb8GTAA5TDySCYUmMtlYKKqlJdUZukEFO7LXztu_Hb_I9aAx-lCHjhENuaAEDC5Qb_VqVCKvL5EDu9sg4RRiq5ovLNJbF9Yy15bXJLIXDM1uEK4ksIrWPGqgpgyLqshG9pEabPU0VKLPWfo1WveVBCj13c",
  },
  {
    id: 3,
    name: "Slipi Jaya",
    status: "RAMAI",
    statusColor: "bg-yellow-100 text-yellow-800",
    waitTime: "55s",
    volume: "280 unit/jam",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBT-1cw81B0ALBV1n17QZpY4LRoTVNWKuTOvtK5PoXUowBV8R74Ea0i7wP_S40dNqhEuVv3jsr1syRk48MvF15fK278x7RcJXwW5ct9Uwh6MhujAWFNOIIC7gGxmlBXwYi7YMt8T6jRalzLJJ1I8qc09SffRvBkV2Pf8M-kXMzjjdxhO0A2fY7FY-9nF9i5gXP3Snc62772cMSCCGwg_N3Lsv5Ufkj8eD12EkSK3iNEBpcRDHwfT55vabQmrneyY6AKKYpc-aj50M",
  },
  {
    id: 4,
    name: "Kelapa Gading",
    status: "LANCAR",
    statusColor: "bg-on-primary-container text-primary-fixed",
    waitTime: "25s",
    volume: "150 unit/jam",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQkG99t4cKwG1bsZ5eUs-iwGfo6YHX_toJxTXkzVI2PVv-sAzx2iqL0RtBXmAqvxhcB6dQYXyH1XeHxcQetUh84OpYi-arFvSan5MbU7Bb0C5tB-GU1lgVSLKYRO4I5lirPGhK6_xPkGYJpXLTm99O5V31jbTjNKLXuROJ0bkvhVxI6nFar8dtbwugs9RIYg8PVslpvV0Cwa3Wn9JSOFbSyb-q6ZFMdyiVODhFx_MkZ0gZlYpmpg2RBmBfNbCxsWYhLuzIvD7oHls",
  },
];

export default function IntersectionGrid() {
  const router = useRouter();

  const handleClick = (id: number) => {
    router.push(`/persimpangan/${id}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {intersections.map((intersection, idx) => (
        <motion.div
          key={intersection.name}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => handleClick(intersection.id)}
          className="bg-surface-container-lowest p-1 rounded-xl shadow-sm border border-outline-variant/15 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="relative h-32 w-full bg-slate-200 overflow-hidden">
            <Image
              src={intersection.image}
              alt={`Peta ${intersection.name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-headline font-bold text-slate-900 group-hover:text-primary transition-colors">
                {intersection.name}
              </h5>
              <span
                className={`px-2 py-0.5 ${intersection.statusColor} text-[10px] font-bold rounded-full`}
              >
                {intersection.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">timer</span>
                {intersection.waitTime}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">group</span>
                {intersection.volume}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                Lihat Detail
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
