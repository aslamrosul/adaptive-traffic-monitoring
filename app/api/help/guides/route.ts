import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Static guides data with multi-language support
const guidesData: Record<string, any[]> = {
  id: [
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

const guidesEn = [
  {
    id: 'guide_001',
    title: 'Getting Started Guide',
    description: 'Learn the basics of using Adaptive Traffic Monitoring',
    icon: 'rocket_launch',
    color: 'bg-blue-100 text-blue-600',
    category: 'getting-started',
    duration: '10 minutes',
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Login to System',
        description: 'Use credentials provided by admin',
        content:
          'Open the application and enter your email and password. If this is your first login, you will be asked to change the default password.',
      },
      {
        title: 'Familiarize Dashboard',
        description: 'Understand main dashboard components',
        content:
          'Dashboard displays real-time statistics, intersection status, and latest alerts. Use sidebar to navigate to other pages.',
      },
      {
        title: 'Monitor Intersections',
        description: 'View intersection status and data',
        content:
          'Click on intersection card to view complete details including vehicle volume, light status, and sensor data.',
      },
      {
        title: 'Create Reports',
        description: 'Document incidents or issues',
        content:
          'Use Reports page to create documentation of incidents, technical issues, or important observations.',
      },
    ],
    relatedGuides: ['guide_002', 'guide_003'],
    tags: ['beginner', 'basic', 'tutorial'],
    views: 2450,
    lastUpdated: '2024-01-15',
  },
  {
    id: 'guide_002',
    title: 'Video Tutorials',
    description: 'Watch complete guide videos',
    icon: 'play_circle',
    color: 'bg-purple-100 text-purple-600',
    category: 'video',
    duration: '25 minutes',
    difficulty: 'All Levels',
    videos: [
      {
        title: 'System Introduction',
        url: 'https://example.com/video1',
        duration: '5:30',
        thumbnail: '/thumbnails/intro.jpg',
      },
      {
        title: 'Real-time Monitoring',
        url: 'https://example.com/video2',
        duration: '8:45',
        thumbnail: '/thumbnails/monitoring.jpg',
      },
      {
        title: 'Creating Reports',
        url: 'https://example.com/video3',
        duration: '6:20',
        thumbnail: '/thumbnails/reports.jpg',
      },
      {
        title: 'Analytics and Insights',
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
    description: 'Complete documentation for developers',
    icon: 'code',
    color: 'bg-green-100 text-green-600',
    category: 'developer',
    duration: '30 minutes',
    difficulty: 'Advanced',
    sections: [
      {
        title: 'Authentication',
        description: 'How to authenticate with API',
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Login and get access token',
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
        description: 'Endpoints for intersection data',
        endpoints: [
          {
            method: 'GET',
            path: '/api/intersections',
            description: 'List all intersections',
          },
          {
            method: 'GET',
            path: '/api/intersections/[id]',
            description: 'Intersection details',
          },
          {
            method: 'POST',
            path: '/api/intersections',
            description: 'Add new intersection',
          },
        ],
      },
      {
        title: 'Traffic Data',
        description: 'Endpoints for traffic data',
        endpoints: [
          {
            method: 'GET',
            path: '/api/traffic/realtime',
            description: 'Real-time data',
          },
          {
            method: 'GET',
            path: '/api/analytics/daily',
            description: 'Daily analytics',
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
    title: 'Contact Support',
    description: 'Our team is ready to help 24/7',
    icon: 'support_agent',
    color: 'bg-orange-100 text-orange-600',
    category: 'support',
    duration: '5 minutes',
    difficulty: 'All Levels',
    contacts: [
      {
        type: 'Email',
        value: 'support@traffic-monitoring.com',
        icon: 'email',
        responseTime: '< 2 hours',
      },
      {
        type: 'Phone',
        value: '+62 21 1234 5678',
        icon: 'phone',
        responseTime: 'Immediate',
      },
      {
        type: 'Live Chat',
        value: 'Chat with support team',
        icon: 'chat',
        responseTime: '< 5 minutes',
      },
      {
        type: 'WhatsApp',
        value: '+62 812 3456 7890',
        icon: 'chat',
        responseTime: '< 15 minutes',
      },
    ],
    supportHours: {
      weekdays: '24/7',
      weekends: '24/7',
      holidays: '24/7',
    },
    relatedGuides: ['guide_001'],
    tags: ['support', 'help', 'contact'],
    views: 3120,
    lastUpdated: '2024-01-10',
  },
  {
    id: 'guide_005',
    title: 'IoT Sensor Configuration',
    description: 'Setup and configure ESP32 sensors',
    icon: 'sensors',
    color: 'bg-cyan-100 text-cyan-600',
    category: 'iot',
    duration: '45 minutes',
    difficulty: 'Advanced',
    steps: [
      {
        title: 'Hardware Preparation',
        description: 'Required components',
        content:
          'ESP32 DevKit, HC-SR04 ultrasonic sensor, jumper wires, breadboard, and 5V power supply.',
      },
      {
        title: 'Install Arduino IDE',
        description: 'Setup development environment',
        content:
          'Download and install Arduino IDE. Add ESP32 board manager and install required libraries.',
      },
      {
        title: 'Upload Firmware',
        description: 'Flash code to ESP32',
        content:
          'Open traffic_sensor.ino file, adjust WiFi credentials and Azure IoT Hub connection string, then upload to ESP32.',
      },
      {
        title: 'Testing & Calibration',
        description: 'Verify sensor works',
        content:
          'Monitor serial output to ensure sensor sends data to cloud. Perform calibration if needed.',
      },
    ],
    relatedGuides: ['guide_003'],
    tags: ['iot', 'esp32', 'sensor', 'hardware'],
    views: 680,
    lastUpdated: '2024-01-22',
  },
];

guidesData.en = guidesEn;

// GET: Fetch all guides or specific guide
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();
    const lang = searchParams.get('lang') || 'id';

    const guides = guidesData[lang] || guidesData.id;

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
