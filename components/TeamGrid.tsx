"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const teamMembers = [
  {
    name: "Budi Santoso",
    role: "Lead Developer",
    description: "Arsitek sistem utama dengan fokus pada integrasi cloud dan real-time processing.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBxHEEotN6hGBLc2u0v5SpflmxPPESt43rTLkIa1xGyti4nlbY6J3QkTd4zebZbbEOAMJNPuEInC25tIyI4N0UgYeMxkJ1upGJVRKVYth_h64l6mAGxifA4d0yJHKRCMr-IlJAxOaKvhfjUVZtapg1RWxrx6ZKCEZZcwDHLglv6NYqTSxW6XovA8eyBkuZkzSLCwIuA5N3JBk6JJ38yA-b8EZYNo4UnL-iUaSlCFdRFOWurFvwbyngHJvSFilezj6YxOdiakxJuZ0",
    icons: ["alternate_email", "link"],
  },
  {
    name: "Siti Aminah",
    role: "UI Designer",
    description: "Spesialis dalam visualisasi data kompleks menjadi antarmuka yang intuitif.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrxqJO2_j4DDVnaJfBHIw21JP6DW5Zx2g9Tu98t5zz708lZyPGnMA_EJyFDTR7GHLJlRp2n7K2__U5Mng9G3z_3QRVFU88ELa_ijFmf7GKQfW2gBD1spdbFXFvgAR8fMWrT0KuW66ZQYA3Fg-m_4xZBzlfFEerC4-BTpCIoDQ9sUlEpQcoXLoIJ7nqSktxlai8RiHx8jljFeLc8mZhUKXgDbDBWtuQkcEp4AwbsMDjUAwm_WOEzJ-CVTIUQP_jpGaGPSBlXfXjuos",
    icons: ["palette", "public"],
  },
  {
    name: "Rian Hidayat",
    role: "IoT Specialist",
    description: "Mengelola jaringan sensor pintar dan optimasi transmisi data dari lapangan.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAErz-SmZU0iestq3KA5R70H-cwWYKav9uaB6Dz6V1ODb4l1VPeOwsWWMWvyxYi1pEpM1mfIvv_B_L2ltjgFBxLDTX4FQoeAyUgx8ZsnBz6LDn7dT1g2RJ_uvLz1YlLpNJ84McFjXX1wZRa0ufv81bUph9dTiuG7l464Hrf4dFa4CwRFQO2gbkY0CFbuzjpRWozMRL64lAVLD7DAo4ascdeEPEAjISuZl6AxuDENGSC3GmZa_G2pXGGR2ICJ49eJ0Kh3ATbJZ2683A",
    icons: ["sensors", "memory"],
  },
  {
    name: "Maya Putri",
    role: "Data Analyst",
    description: "Menerjemahkan jutaan titik data menjadi wawasan lalu lintas yang dapat ditindaklanjuti.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBDGMPcJqK8-Slmv_05GcWQ0UDaVAu8nuPwsij-cHHiFrrHRyk6XeMO2ArpfxhhNMHXdH3fC4Tj4p5hnbmTd430EYXlS48_TIUif5isJOhWjIUMR42wpaRyfnPXLg4hRBhGN2bow_txNYfRtfFDY2YsxZynSO_TtqVi2cDoXmMgnSzW7oK-R8ex2t-EqjwQ-pMfgVtSmvm8BoWjUlxwPHBKeZhMgKOhK2irsug3CMfrztN3A5fT2L3bUOSh3C4UacbYZn4XYypiaDU",
    icons: ["insights", "mail"],
  },
];

export default function TeamGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {teamMembers.map((member, idx) => (
        <motion.div
          key={member.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-surface-container relative">
            <Image
              src={member.image}
              alt={member.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-lg text-on-surface">
              {member.name}
            </h3>
            <p className="text-primary-container font-semibold text-sm tracking-tight">
              {member.role}
            </p>
            <p className="text-slate-500 text-sm py-2 leading-relaxed">
              {member.description}
            </p>
            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              {member.icons.map((icon) => (
                <Link
                  key={icon}
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Hiring Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-primary/5 p-8 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center text-center space-y-4 group cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-4 mt-4"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2"
        >
          <span className="material-symbols-outlined text-4xl">group_add</span>
        </motion.div>
        <div className="space-y-2 max-w-md">
          <h3 className="font-headline font-black text-2xl text-on-surface">
            Bergabunglah dengan Kami!
          </h3>
          <p className="text-secondary text-base leading-relaxed">
            Kami terus mencari inovator, insinyur, dan pemikir kreatif untuk membantu
            kami merevolusi mobilitas perkotaan.
          </p>
          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-headline font-bold text-sm shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 mx-auto"
            >
              Lihat Lowongan
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
