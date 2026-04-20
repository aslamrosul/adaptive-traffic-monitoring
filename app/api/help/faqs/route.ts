import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Static FAQ data - bisa dipindahkan ke database jika perlu
const faqs = [
  {
    id: 'faq_001',
    category: 'Umum',
    questions: [
      {
        id: 'q_001',
        question: 'Apa itu Adaptive Traffic Monitoring?',
        answer:
          'Adaptive Traffic Monitoring adalah sistem manajemen lalu lintas cerdas yang menggunakan IoT dan AI untuk mengoptimalkan aliran kendaraan di persimpangan secara real-time.',
        tags: ['umum', 'sistem', 'pengenalan'],
        views: 1250,
        helpful: 980,
      },
      {
        id: 'q_002',
        question: 'Bagaimana cara mengakses dashboard?',
        answer:
          'Login menggunakan kredensial Anda, kemudian Anda akan diarahkan ke dashboard utama yang menampilkan statistik real-time dari semua persimpangan yang terhubung.',
        tags: ['dashboard', 'login', 'akses'],
        views: 850,
        helpful: 720,
      },
      {
        id: 'q_003',
        question: 'Siapa yang bisa menggunakan sistem ini?',
        answer:
          'Sistem ini digunakan oleh operator lalu lintas, admin sistem, dan pihak berwenang yang memiliki akses untuk monitoring dan manajemen lalu lintas.',
        tags: ['pengguna', 'akses', 'role'],
        views: 620,
        helpful: 540,
      },
    ],
  },
  {
    id: 'faq_002',
    category: 'Fitur',
    questions: [
      {
        id: 'q_004',
        question: 'Bagaimana cara melihat detail simpangan?',
        answer:
          'Klik pada card simpangan di dashboard atau gunakan search bar untuk mencari simpangan tertentu. Anda juga bisa mengakses halaman Persimpangan untuk melihat semua simpangan dalam bentuk grid.',
        tags: ['simpangan', 'detail', 'navigasi'],
        views: 1100,
        helpful: 890,
      },
      {
        id: 'q_005',
        question: 'Apa itu Manual Override?',
        answer:
          'Manual Override memungkinkan operator mengambil alih kontrol lampu lalu lintas secara manual saat kondisi darurat atau situasi khusus yang memerlukan intervensi langsung.',
        tags: ['manual', 'override', 'kontrol'],
        views: 950,
        helpful: 820,
      },
      {
        id: 'q_006',
        question: 'Bagaimana cara membuat laporan?',
        answer:
          'Buka halaman Laporan, klik tombol "Buat Laporan Baru", pilih persimpangan, jenis laporan, prioritas, dan isi detail laporan. Laporan akan langsung tersimpan dan bisa diakses oleh tim.',
        tags: ['laporan', 'report', 'create'],
        views: 780,
        helpful: 650,
      },
      {
        id: 'q_007',
        question: 'Bagaimana cara melihat data historis?',
        answer:
          'Buka halaman Analist untuk melihat grafik dan tren data historis. Anda bisa filter berdasarkan tanggal, persimpangan, dan jenis data yang ingin dilihat.',
        tags: ['historis', 'analitik', 'data'],
        views: 680,
        helpful: 590,
      },
    ],
  },
  {
    id: 'faq_003',
    category: 'IoT & Sensor',
    questions: [
      {
        id: 'q_008',
        question: 'Sensor IoT tidak terhubung, apa yang harus dilakukan?',
        answer:
          'Periksa koneksi internet, restart perangkat IoT, dan pastikan firmware sudah update. Jika masalah berlanjut, hubungi tim teknis melalui menu Support.',
        tags: ['iot', 'sensor', 'troubleshooting'],
        views: 1450,
        helpful: 1120,
      },
      {
        id: 'q_009',
        question: 'Berapa interval pengambilan data sensor?',
        answer:
          'Default interval adalah 5 detik. Anda bisa mengubahnya di menu Pengaturan > IoT & Sensor. Interval yang lebih pendek memberikan data lebih real-time tapi menggunakan lebih banyak bandwidth.',
        tags: ['sensor', 'interval', 'konfigurasi'],
        views: 520,
        helpful: 440,
      },
      {
        id: 'q_010',
        question: 'Bagaimana cara menambah sensor baru?',
        answer:
          'Hubungi admin sistem untuk registrasi device ID baru di Azure IoT Hub. Setelah terdaftar, konfigurasikan ESP32 dengan connection string yang diberikan.',
        tags: ['sensor', 'tambah', 'setup'],
        views: 380,
        helpful: 320,
      },
    ],
  },
  {
    id: 'faq_004',
    category: 'Troubleshooting',
    questions: [
      {
        id: 'q_011',
        question: 'Data tidak update real-time?',
        answer:
          'Refresh halaman browser Anda. Jika masalah berlanjut, periksa pengaturan interval pengambilan data di menu Pengaturan > IoT & Sensor. Pastikan juga koneksi internet stabil.',
        tags: ['realtime', 'update', 'troubleshooting'],
        views: 920,
        helpful: 780,
      },
      {
        id: 'q_012',
        question: 'Grafik tidak muncul di halaman Analist?',
        answer:
          'Pastikan ada data historis untuk periode yang dipilih. Coba pilih range tanggal yang lebih luas. Jika masih bermasalah, clear browser cache dan refresh halaman.',
        tags: ['grafik', 'analist', 'troubleshooting'],
        views: 560,
        helpful: 470,
      },
      {
        id: 'q_013',
        question: 'Tidak bisa login ke sistem?',
        answer:
          'Pastikan email dan password benar. Jika lupa password, gunakan fitur "Lupa Password". Jika masih bermasalah, hubungi admin untuk reset akun Anda.',
        tags: ['login', 'password', 'akses'],
        views: 1280,
        helpful: 1050,
      },
      {
        id: 'q_014',
        question: 'Notifikasi tidak muncul?',
        answer:
          'Periksa pengaturan notifikasi di menu Pengaturan > Notifikasi. Pastikan browser mengizinkan notifikasi dari aplikasi ini. Untuk email notifikasi, periksa folder spam.',
        tags: ['notifikasi', 'alert', 'troubleshooting'],
        views: 640,
        helpful: 530,
      },
    ],
  },
  {
    id: 'faq_005',
    category: 'Keamanan',
    questions: [
      {
        id: 'q_015',
        question: 'Bagaimana cara mengubah password?',
        answer:
          'Buka menu Profil > Pengaturan > Keamanan. Masukkan password lama, password baru, dan konfirmasi password baru. Klik Simpan Perubahan.',
        tags: ['password', 'keamanan', 'akun'],
        views: 890,
        helpful: 760,
      },
      {
        id: 'q_016',
        question: 'Apa itu Two-Factor Authentication?',
        answer:
          '2FA menambah lapisan keamanan ekstra dengan memerlukan kode verifikasi selain password saat login. Sangat direkomendasikan untuk akun admin.',
        tags: ['2fa', 'keamanan', 'autentikasi'],
        views: 420,
        helpful: 360,
      },
      {
        id: 'q_017',
        question: 'Bagaimana cara logout dari semua device?',
        answer:
          'Buka menu Profil > Pengaturan > Keamanan > Sesi Aktif. Klik "Logout" pada setiap sesi yang ingin diakhiri, atau gunakan tombol "Logout Semua Device".',
        tags: ['logout', 'sesi', 'keamanan'],
        views: 310,
        helpful: 270,
      },
    ],
  },
];

// GET: Fetch all FAQs or search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const category = searchParams.get('category');

    let filteredFaqs = faqs;

    // Filter by category
    if (category) {
      filteredFaqs = faqs.filter(
        (faq) => faq.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search in questions and answers
    if (search) {
      filteredFaqs = faqs
        .map((faq) => ({
          ...faq,
          questions: faq.questions.filter(
            (q) =>
              q.question.toLowerCase().includes(search) ||
              q.answer.toLowerCase().includes(search) ||
              q.tags.some((tag) => tag.includes(search))
          ),
        }))
        .filter((faq) => faq.questions.length > 0);
    }

    return NextResponse.json({
      success: true,
      count: filteredFaqs.reduce((acc, faq) => acc + faq.questions.length, 0),
      data: filteredFaqs,
    });
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch FAQs',
      },
      { status: 500 }
    );
  }
}

// POST: Mark FAQ as helpful
export async function POST(request: Request) {
  try {
    const { faqId, helpful } = await request.json();

    if (!faqId) {
      return NextResponse.json(
        {
          success: false,
          error: 'faqId is required',
        },
        { status: 400 }
      );
    }

    // In production, save this to database
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Feedback recorded',
      data: {
        faqId,
        helpful,
      },
    });
  } catch (error: any) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to record feedback',
      },
      { status: 500 }
    );
  }
}
