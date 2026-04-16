import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Static guides data
const guides = [
  {
    id: 'guide_001',
    title: 'Panduan Memulai',
    description: 'Pelajari dasar-dasar menggunakan Adaptive Traffic Monitoring',
    icon: 'rocket_launch',
    color: 'bg-blue-100 text-blue-600',
    category: 'getting-started',
    duration: '10 menit',
    difficulty: 'Pemula',
    steps: [
      {
        title: 'Login ke Sistem',
        description: 'Gunakan kredensial yang diberikan oleh admin',
        content:
          'Buka aplikasi dan masukkan email serta password Anda. Jika ini pertama kali login, Anda akan diminta mengubah password default.',
      },
      {
        title: 'Kenali Dashboard',
        description: 'Pahami komponen utama dashboard',
        content:
          'Dashboard menampilkan statistik real-time, status persimpangan, dan alert terbaru. Gunakan sidebar untuk navigasi ke halaman lain.',
      },
      {
        title: 'Monitor Persimpangan',
        description: 'Lihat status dan data persimpangan',
        content:
          'Klik pada card persimpangan untuk melihat detail lengkap termasuk volume kendaraan, status lampu, dan sensor data.',
      },
      {
        title: 'Buat Laporan',
        description: 'Dokumentasikan kejadian atau masalah',
        content:
          'Gunakan halaman Laporan untuk membuat dokumentasi kejadian, masalah teknis, atau observasi penting.',
      },
    ],
    relatedGuides: ['guide_002', 'guide_003'],
    tags: ['pemula', 'dasar', 'tutorial'],
    views: 2450,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'guide_002',
    title: 'Video Tutorial',
    description: 'Tonton video panduan lengkap',
    icon: 'play_circle',
    color: 'bg-purple-100 text-purple-600',
    category: 'video',
    duration: '25 menit',
    difficulty: 'Semua Level',
    videos: [
      {
        title: 'Pengenalan Sistem',
        url: 'https://example.com/video1',
        duration: '5:30',
        thumbnail: '/thumbnails/intro.jpg',
      },
      {
        title: 'Monitoring Real-time',
        url: 'https://example.com/video2',
        duration: '8:45',
        thumbnail: '/thumbnails/monitoring.jpg',
      },
      {
        title: 'Membuat Laporan',
        url: 'https://example.com/video3',
        duration: '6:20',
        thumbnail: '/thumbnails/reports.jpg',
      },
      {
        title: 'Analitik dan Insights',
        url: 'https://example.com/video4',
        duration: '10:15',
        thumbnail: '/thumbnails/analytics.jpg',
      },
    ],
    relatedGuides: ['guide_001', 'guide_004'],
    tags: ['video', 'tutorial', 'visual'],
    views: 1890,
    lastUpdated: '2024-01-20',
  },
  {
    id: 'guide_003',
    title: 'API Documentation',
    description: 'Dokumentasi lengkap untuk developer',
    icon: 'code',
    color: 'bg-green-100 text-green-600',
    category: 'developer',
    duration: '30 menit',
    difficulty: 'Advanced',
    sections: [
      {
        title: 'Authentication',
        description: 'Cara autentikasi dengan API',
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login dan dapatkan access token',
          },
          {
            method: 'POST',
            path: '/api/auth/refresh',
            description: 'Refresh access token',
          },
        ],
      },
      {
        title: 'Intersections',
        description: 'Endpoint untuk data persimpangan',
        endpoints: [
          {
            method: 'GET',
            path: '/api/intersections',
            description: 'List semua persimpangan',
          },
          {
            method: 'GET',
            path: '/api/intersections/[id]',
            description: 'Detail persimpangan',
          },
          {
            method: 'POST',
            path: '/api/intersections',
            description: 'Tambah persimpangan baru',
          },
        ],
      },
      {
        title: 'Traffic Data',
        description: 'Endpoint untuk data lalu lintas',
        endpoints: [
          {
            method: 'GET',
            path: '/api/traffic/realtime',
            description: 'Data real-time',
          },
          {
            method: 'GET',
            path: '/api/analytics/daily',
            description: 'Analitik harian',
          },
        ],
      },
    ],
    relatedGuides: ['guide_004'],
    tags: ['api', 'developer', 'technical'],
    views: 1250,
    lastUpdated: '2024-01-18',
  },
  {
    id: 'guide_004',
    title: 'Hubungi Support',
    description: 'Tim kami siap membantu 24/7',
    icon: 'support_agent',
    color: 'bg-orange-100 text-orange-600',
    category: 'support',
    duration: '5 menit',
    difficulty: 'Semua Level',
    contacts: [
      {
        type: 'Email',
        value: 'support@traffic-monitoring.com',
        icon: 'email',
        responseTime: '< 2 jam',
      },
      {
        type: 'Phone',
        value: '+62 21 1234 5678',
        icon: 'phone',
        responseTime: 'Langsung',
      },
      {
        type: 'Live Chat',
        value: 'Chat dengan tim support',
        icon: 'chat',
        responseTime: '< 5 menit',
      },
      {
        type: 'WhatsApp',
        value: '+62 812 3456 7890',
        icon: 'chat',
        responseTime: '< 15 menit',
      },
    ],
    supportHours: {
      weekdays: '24/7',
      weekends: '24/7',
      holidays: '24/7',
    },
    relatedGuides: ['guide_001'],
    tags: ['support', 'bantuan', 'kontak'],
    views: 3120,
    lastUpdated: '2024-01-10',
  },
  {
    id: 'guide_005',
    title: 'Konfigurasi IoT Sensor',
    description: 'Setup dan konfigurasi ESP32 sensor',
    icon: 'sensors',
    color: 'bg-cyan-100 text-cyan-600',
    category: 'iot',
    duration: '45 menit',
    difficulty: 'Advanced',
    steps: [
      {
        title: 'Persiapan Hardware',
        description: 'Komponen yang dibutuhkan',
        content:
          'ESP32 DevKit, sensor ultrasonik HC-SR04, kabel jumper, breadboard, dan power supply 5V.',
      },
      {
        title: 'Install Arduino IDE',
        description: 'Setup development environment',
        content:
          'Download dan install Arduino IDE. Tambahkan ESP32 board manager dan install library yang diperlukan.',
      },
      {
        title: 'Upload Firmware',
        description: 'Flash code ke ESP32',
        content:
          'Buka file traffic_sensor.ino, sesuaikan WiFi credentials dan Azure IoT Hub connection string, lalu upload ke ESP32.',
      },
      {
        title: 'Testing & Kalibrasi',
        description: 'Verifikasi sensor bekerja',
        content:
          'Monitor serial output untuk memastikan sensor mengirim data ke cloud. Lakukan kalibrasi jika diperlukan.',
      },
    ],
    relatedGuides: ['guide_003'],
    tags: ['iot', 'esp32', 'sensor', 'hardware'],
    views: 680,
    lastUpdated: '2024-01-22',
  },
];

// GET: Fetch all guides or specific guide
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    // Get specific guide by ID
    if (id) {
      const guide = guides.find((g) => g.id === id);
      if (!guide) {
        return NextResponse.json(
          {
            success: false,
            error: 'Guide not found',
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: guide,
      });
    }

    let filteredGuides = guides;

    // Filter by category
    if (category) {
      filteredGuides = guides.filter((g) => g.category === category);
    }

    // Search
    if (search) {
      filteredGuides = guides.filter(
        (g) =>
          g.title.toLowerCase().includes(search) ||
          g.description.toLowerCase().includes(search) ||
          g.tags.some((tag) => tag.includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: filteredGuides.length,
      data: filteredGuides,
    });
  } catch (error: any) {
    console.error('Error fetching guides:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch guides',
      },
      { status: 500 }
    );
  }
}
