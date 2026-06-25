import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from './firebase';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';

// Config untuk secondary app (buat akun tanpa logout admin)
const firebaseConfig = {
  apiKey: "AIzaSyBgVPUwmlcd8jp6pz8bPnRciOy9reTNax4",
  authDomain: "e-julu.firebaseapp.com",
  projectId: "e-julu",
  storageBucket: "e-julu.firebasestorage.app",
  messagingSenderId: "805811702740",
  appId: "1:805811702740:web:242b1b59af34db850a2441"
};
import {
  doc, setDoc, getDoc, collection,
  getDocs, updateDoc, addDoc, deleteDoc, query, where, orderBy, limit
} from 'firebase/firestore';

function App() {
  const [page, setPage] = useState('splash');
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [selectedMapel, setSelectedMapel] = useState(null);
  const [selectedBab, setSelectedBab] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [guruPilihTingkat, setGuruPilihTingkat] = useState(null);

  const [siswaLoginNISN, setSiswaLoginNISN] = useState('');
  const [siswaLoginPassword, setSiswaLoginPassword] = useState('');
  const [guruLoginNIP, setGuruLoginNIP] = useState('');
  const [guruLoginPassword, setGuruLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [siswaForm, setSiswaForm] = useState({
    nisn:'', nama:'', tglLahir:'', email:'', telpon:'',
    agama:'', password:'', konfirmasi:'', kelas:'',
    jurusan:'', citaCita:'', hobby:'', bio:''
  });
  const [guruForm, setGuruForm] = useState({
    nip:'', nik:'', nama:'', namaPanggilan:'', mapel:'',
    jabatan:'', email:'', telpon:'', password:'', konfirmasi:'', bio:''
  });
  const [siswaError, setSiswaError] = useState('');
  const [guruError, setGuruError] = useState('');
  const [fotoDiambil, setFotoDiambil] = useState(false);
  const [fotoGuruDiambil, setFotoGuruDiambil] = useState(false);
  const [fotoDataUrl, setFotoDataUrl] = useState('');
  const [fotoGuruDataUrl, setFotoGuruDataUrl] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoGuruRef = useRef(null);
  const canvasGuruRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraGuruActive, setCameraGuruActive] = useState(false);

  // Quiz (Forum Belajar)
  const [quizSoalIndex, setQuizSoalIndex] = useState(0);
  const [quizJawaban, setQuizJawaban] = useState({});
  const [quizSelesai, setQuizSelesai] = useState(false);
  const [quizSoalAcak, setQuizSoalAcak] = useState([]);
  const [timer, setTimer] = useState(20);
  const timerRef = useRef(null);
  const hasilTersimpan = useRef(false);

  const [modulDurasi, setModulDurasi] = useState(0);
  const [videoDurasi, setVideoDurasi] = useState(0);
  const modulTimerRef = useRef(null);
  const videoTimerRef = useRef(null);

  const [babList, setBabList] = useState([]);
  const [quizSoalList, setQuizSoalList] = useState([]);
  const [hasilSiswa, setHasilSiswa] = useState([]);
  const [babBaru, setBabBaru] = useState('');
  const [editBab, setEditBab] = useState(null);
  const [linkEdit, setLinkEdit] = useState({ modul:'', modul2:'', video:'' });
  const [soalBaru, setSoalBaru] = useState({ tipe:'pg', soal:'', opsi:['A. ','B. ','C. ','D. ','E. '], kunci:'A' });
  const [essayBaru, setEssayBaru] = useState('');
  const [nilaiEssayInput, setNilaiEssayInput] = useState({});
  const [lihatTab, setLihatTab] = useState('pg');

  // Admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminTab, setAdminTab] = useState('pending');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPoinForm, setEditPoinForm] = useState({});
  const [adminMsg, setAdminMsg] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [appSettings, setAppSettings] = useState({ namaSekolah: 'SMA NEGERI 1 LUMBANJULU', tagline: 'E-Learning', welcomeText: 'Selamat Datang di E-Julu!' });

  // Pengaturan
  const [pengaturanMsg, setPengaturanMsg] = useState('');
  const [editBioForm, setEditBioForm] = useState({ bio: '', citaCita: '', hobby: '' });
  const [gantiPwForm, setGantiPwForm] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [showLamaPw, setShowLamaPw] = useState(false);
  const [showGantiPw, setShowGantiPw] = useState(false);
  const [showKonfirmasiPw, setShowKonfirmasiPw] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // About
  const [aboutData, setAboutData] = useState({ namaSekolah: 'SMA NEGERI 1 LUMBANJULU', namaKepsek: '', jabatanKepsek: 'Kepala Sekolah', tentang: '', visi: '', misi: '', fotoSekolah: '', fotoKepsek: '', deskripsiApp: '' });
  const [aboutTab, setAboutTab] = useState('sekolah');
  const [uploadingFoto, setUploadingFoto] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);

  // Diskusi
  const [diskusiList, setDiskusiList] = useState([]);
  const [diskusiInput, setDiskusiInput] = useState('');
  const [diskusiLoading, setDiskusiLoading] = useState(false);
  const [diskusiEditId, setDiskusiEditId] = useState(null);
  const [diskusiEditText, setDiskusiEditText] = useState('');
  const [diskusiActionId, setDiskusiActionId] = useState(null);
  const longPressTimer = useRef(null);

  // Daftar Siswa & Guru
  const [daftarSiswaList, setDaftarSiswaList] = useState([]);
  const [daftarGuruList, setDaftarGuruList] = useState([]);
  const [daftarLoading, setDaftarLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [daftarSiswaTingkat, setDaftarSiswaTingkat] = useState(null);
  const [daftarSiswaJurusan, setDaftarSiswaJurusan] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchSiswa, setSearchSiswa] = useState('');
  const [searchGuru, setSearchGuru] = useState('');

  // Pengumuman
  const [pengumumanList, setPengumumanList] = useState([]);
  const [pengumumanForm, setPengumumanForm] = useState({ judul: '', isi: '', target: 'semua' });
  const [pengumumanLoading, setPengumumanLoading] = useState(false);
  const [pengumumanMsg, setPengumumanMsg] = useState('');

  // Rekap nilai siswa
  const [rekapSiswaList, setRekapSiswaList] = useState([]);
  const [rekapSiswaLoading, setRekapSiswaLoading] = useState(false);

  // Badge pesan belum dibaca
  const [pesanBadge, setPesanBadge] = useState(0);

  // Quiz attempt limit
  const [quizSudahPernah, setQuizSudahPernah] = useState(false);
  const [quizHasilLama, setQuizHasilLama] = useState(null);

  // Import massal siswa
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importPreview, setImportPreview] = useState([]);

  // RBAC Admin
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [tahunAjaranForm, setTahunAjaranForm] = useState({ tahun: '', semester: '1', aktif: false });
  const [kelasForm, setKelasForm] = useState({ tingkat: '10', jurusan: 'A', waliKelas: '' });
  const [adminStats, setAdminStats] = useState(null);
  const [adminStatsLoading, setAdminStatsLoading] = useState(false);
  const [mapelEditList, setMapelEditList] = useState([]);
  const [mapelLoading, setMapelLoading] = useState(false);
  const [guruListForMapel, setGuruListForMapel] = useState([]);
  const [migrasiLoading, setMigrasiLoading] = useState(false);

  // #9 Foto profil (Base64 di Firestore)
  const [uploadFotoProfil, setUploadFotoProfil] = useState(false);
  const [fotoProfilDataUrl, setFotoProfilDataUrl] = useState('');

  // #11 Kalender akademik
  const [kalenderList, setKalenderList] = useState([]);
  const [kalenderLoading, setKalenderLoading] = useState(false);
  const [kalenderForm, setKalenderForm] = useState({ judul: '', tanggal: '', tanggalAkhir: '', tipe: 'umum', deskripsi: '' });
  const [kalenderMsg, setKalenderMsg] = useState('');
  const [kalenderTab, setKalenderTab] = useState('semua');

  // #12 File materi Google Drive per bab (field fileDrive di dokumen bab)
  const [linkEditDrive, setLinkEditDrive] = useState('');

  // Ganti password pertama kali & lengkapi profil
  const [gantiPassBaru, setGantiPassBaru] = useState('');
  const [gantiPassKonfirm, setGantiPassKonfirm] = useState('');
  const [gantiPassMsg, setGantiPassMsg] = useState('');
  const [gantiPassLoading, setGantiPassLoading] = useState(false);
  const [showGantiPass, setShowGantiPass] = useState(false);
  const [showGantiPassKonfirm, setShowGantiPassKonfirm] = useState(false);
  const [lengkapForm, setLengkapForm] = useState({ jenisKelamin: '', agama: 'Islam', kewarganegaraan: 'WNI', email: '', telpon: '', bio: '', namaPanggilan: '' });
  const [lengkapMsg, setLengkapMsg] = useState('');
  const [lengkapLoading, setLengkapLoading] = useState(false);

  // Import guru
  const [importGuruLoading, setImportGuruLoading] = useState(false);
  const [importGuruMsg, setImportGuruMsg] = useState('');
  const [importGuruPreview, setImportGuruPreview] = useState([]);
  const [adminPassImport, setAdminPassImport] = useState('');
  const [adminPassSiswaImport, setAdminPassSiswaImport] = useState('');

  const agamaList = ['Islam','Kristen Protestan','Katolik','Hindu','Buddha','Konghucu'];
  const jabatanList = ['Guru Mapel','Wali Kelas','Kepala Sekolah','Wakil Kepala Sekolah','Guru BK','Staf TU'];
  const mapelList = [
    { id:1,  nama:'Matematika',       icon:'📐', warna:'#8e44ad' },
    { id:2,  nama:'Bahasa Indonesia', icon:'📖', warna:'#2980b9' },
    { id:3,  nama:'Bahasa Inggris',   icon:'🌐', warna:'#16a085' },
    { id:4,  nama:'Fisika',           icon:'⚡', warna:'#d35400' },
    { id:5,  nama:'Kimia',            icon:'🧪', warna:'#27ae60' },
    { id:6,  nama:'Biologi',          icon:'🧬', warna:'#c0392b' },
    { id:7,  nama:'Sejarah',          icon:'🏛️', warna:'#7f8c8d' },
    { id:8,  nama:'Geografi',         icon:'🌍', warna:'#1a9e5f' },
    { id:9,  nama:'Ekonomi',          icon:'📊', warna:'#f39c12' },
    { id:10, nama:'Sosiologi',        icon:'👥', warna:'#9b59b6' },
    { id:11, nama:'PJOK',             icon:'⚽', warna:'#1abc9c' },
    { id:12, nama:'Seni Budaya',      icon:'🎨', warna:'#e74c3c' },
    { id:13, nama:'Informatika',      icon:'💻', warna:'#2471a3' },
    { id:14, nama:'PPKn',             icon:'🇮🇩', warna:'#e67e22' },
    { id:15, nama:'Agama',            icon:'🕌', warna:'#1a5276' },
    { id:16, nama:'Bahasa Daerah',    icon:'🗣️', warna:'#6d4c41' },
  ];

  // Daftar mapel yang benar-benar dipakai di Forum Belajar & form daftar guru.
  // Default-nya pakai daftar bawaan di atas, lalu di-overwrite begitu data dari Firestore (masterMapel) selesai dimuat.
  const [mapelAktif, setMapelAktif] = useState(mapelList);


  // ── Android Back Button ─────────────────────────────────────
  // Pakai pageStack (ref) sebagai riwayat navigasi sendiri.
  // Setiap goTo() push ke stack. Back button pop dari stack.
  // Tidak bergantung pada browser history yang cepat habis di Android.
  const pageStack = useRef(['splash']);

  const goTo = (newPage) => {
    const stack = pageStack.current;
    if (stack[stack.length - 1] !== newPage) stack.push(newPage);
    window.history.pushState({ p: newPage }, '', window.location.href);
    setPage(newPage);
  };

  const goBack = () => {
    const stack = pageStack.current;
    const cur = stack[stack.length - 1];
    // Hanya dashboard yang jadi tembok — tidak bisa back lebih jauh
    // splash, gantiPasswordPertama, lengkapiProfil juga ditahan
    const stopPages = ['dashboard', 'adminDashboard', 'splash', 'gantiPasswordPertama', 'lengkapiProfil'];
    if (stopPages.includes(cur) || stack.length <= 1) {
      // Push state baru agar buffer tidak habis
      window.history.pushState({ p: 'hold' }, '', window.location.href);
      return;
    }
    stack.pop();
    const prev = stack[stack.length - 1];
    window.history.pushState({ p: prev }, '', window.location.href);
    setPage(prev);
  };

  useEffect(() => {
    const onPop = (e) => { e.preventDefault(); goBack(); };
    window.addEventListener('popstate', onPop);
    // Seed 10 state buffer agar Android tidak langsung exit app
    for (let i = 0; i < 10; i++) {
      window.history.pushState({ p: 'buf' + i }, '', window.location.href);
    }
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ── Auth listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'approved') {
              setUserData(data);
              setUserRole(data.role);
              goTo(data.role === 'admin' ? 'adminDashboard' : 'dashboard');
              // Load badge pesan belum dibaca (khusus siswa)
              if (data.role === 'siswa') {
                try {
                  const badgeSnap = await getDocs(query(collection(db, 'pesan'), where('siswaId', '==', user.uid), where('pengirim', '==', 'guru'), where('dibaca', '==', false)));
                  setPesanBadge(badgeSnap.size);
                } catch (e) { /* silent */ }
              }
            } else if (data.status === 'pending') {
              setPage('menunggu');
            } else {
              setPage('ditolak');
            }
          } else {
            await signOut(auth);
            setPage('role');
          }
        } catch (err) {
          console.error('Auth listener error:', err);
          await signOut(auth);
          setPage('role');
        }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // ── Muat daftar mapel aktif (Forum Belajar & form daftar guru) ─
  useEffect(() => {
    loadMapelAktif();
  }, []);

  // ── Sinkronkan perubahan dari Panel Admin > Kelola Mapel ───────
  useEffect(() => {
    if (mapelEditList.length > 0) setMapelAktif(mapelEditList);
  }, [mapelEditList]);

  // ── Bingkai tampilan desktop ────────────────────────────────────
  // Cuma nyala di layar lebar (≥768px). Gak nyentuh satu pun komponen halaman —
  // ini cuma nambah background & bayangan di LUAR kartu yang sudah ada.
  // Tampilan HP/Android sama sekali tidak terpengaruh (selalu < 768px).
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-ejulu-desktop-frame', 'true');
    style.textContent = `
      @media (min-width: 768px) {
        html, body {
          height: 100%;
          margin: 0;
          background: linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#1e3a8a 100%) fixed;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(37,99,235,0.2) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        #root {
          min-height: 100vh;
          display: flex !important;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
        }
        #root > div {
          width: 430px !important;
          max-width: 430px !important;
          min-height: 80vh;
          max-height: 88vh;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          border-radius: 40px !important;
          box-shadow:
            0 0 0 10px #1a1a2e,
            0 0 0 12px #2d2d44,
            0 40px 80px rgba(0,0,0,0.6),
            0 8px 32px rgba(0,0,0,0.4) !important;
          position: relative;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        #root > div::-webkit-scrollbar { display: none; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // ── Deteksi keluar app (bukan sekedar minimize) ─────────────
  useEffect(() => {
    let hiddenTime = null;
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else {
        // Hanya logout dari quiz jika sudah > 3 detik (buka app lain, bukan minimize)
        const elapsed = Date.now() - (hiddenTime || 0);
        if (elapsed > 3000 && page === 'quiz') {
          clearInterval(timerRef.current);
          goTo('loginSiswa');
          setQuizJawaban({});
          setQuizSoalIndex(0);
          setQuizSelesai(false);
        }
        hiddenTime = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [page]);

  // ── Timer quiz forum ──────────────────────────────────────────
  useEffect(() => {
    if (page === 'quiz' && !quizSelesai) {
      const pgSoal = quizSoalAcak.filter(s => s.tipe === 'pg');
      if (quizSoalIndex >= pgSoal.length) return;
      setTimer(20);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleNextSoal(true);
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [page, quizSoalIndex, quizSelesai]);

  const handleNextSoal = (timeout = false) => {
    clearInterval(timerRef.current);
    const pgSoal = quizSoalAcak.filter(s => s.tipe === 'pg');
    if (quizSoalIndex < pgSoal.length - 1) {
      setQuizSoalIndex(i => i + 1);
    } else {
      setQuizSoalIndex(pgSoal.length);
    }
  };

  const loadBab = async (mapelNama) => {
    const q = query(collection(db, 'bab'), where('mapel', '==', mapelNama));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => a.urutan - b.urutan);
    setBabList(list);
  };

  const loadSoal = async (babId) => {
    const q = query(collection(db, 'soal'), where('babId', '==', babId));
    const snap = await getDocs(q);
    setQuizSoalList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadHasilSiswa = async (babId, filterKelas) => {
    let q;
    if (filterKelas) {
      q = query(collection(db, 'hasilQuiz'), where('babId', '==', babId), where('siswaKelas', '==', filterKelas));
    } else {
      q = query(collection(db, 'hasilQuiz'), where('babId', '==', babId));
    }
    const snap = await getDocs(q);
    setHasilSiswa(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const mulaiTimerModul = () => { modulTimerRef.current = setInterval(() => setModulDurasi(p => p + 1), 60000); };
  const stopTimerModul = () => clearInterval(modulTimerRef.current);
  const mulaiTimerVideo = () => { videoTimerRef.current = setInterval(() => setVideoDurasi(p => p + 1), 60000); };
  const stopTimerVideo = () => clearInterval(videoTimerRef.current);

  const hitungPoinModul = () => {
    const modulOk = modulDurasi >= 120 ? 1 : modulDurasi / 120;
    const videoOk = videoDurasi >= 10 ? 1 : videoDurasi / 10;
    return Math.round(((modulOk + videoOk) / 2) * 50);
  };

  const hitungPoinPG = () => {
    const pgSoal = quizSoalAcak.filter(s => s.tipe === 'pg');
    if (!pgSoal.length) return 0;
    const benar = pgSoal.filter(s => quizJawaban[s.id] === s.kunci).length;
    return Math.round((benar / pgSoal.length) * 20);
  };

  const acakSoal = (soalList) => {
    const pg = soalList.filter(s => s.tipe === 'pg').sort(() => Math.random() - 0.5);
    const essay = soalList.filter(s => s.tipe === 'essay');
    return [...pg, ...essay];
  };

  useEffect(() => {
    if (quizSelesai && !hasilTersimpan.current) {
      hasilTersimpan.current = true;
      simpanHasilQuiz();
    }
  }, [quizSelesai]);

  const simpanHasilQuiz = async () => {
    if (!userData || !selectedBab) return;
    const poinPG = hitungPoinPG();
    const essayJawaban = quizSoalAcak.filter(s => s.tipe === 'essay').map(s => ({ soalId: s.id, soal: s.soal, jawaban: quizJawaban[s.id] || '' }));
    try {
      await addDoc(collection(db, 'hasilQuiz'), {
        babId: selectedBab.id, babJudul: selectedBab.judul || '', mapel: selectedMapel.nama, siswaId: userData.uid,
        siswaNama: userData.nama, siswaKelas: `${userData.kelas}${userData.jurusan}`,
        poinPG, essayJawaban, nilaiEssay: null, modulDurasi, videoDurasi, timestamp: new Date()
      });
      const poinPGBaru = (userData.poinPG || 0) + poinPG;
      const poinModulBaru = hitungPoinModul();
      await updateDoc(doc(db, 'users', userData.uid), {
        poinPG: poinPGBaru, poinModul: poinModulBaru,
        totalPoin: poinPGBaru + (userData.poinEssay || 0) + poinModulBaru
      });
    } catch (err) { console.error('Gagal simpan hasil quiz:', err); }
  };

  // Kamera & form helpers
  const startKameraSiswa = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch { alert('Kamera tidak bisa diakses.'); }
  };
  const ambilFotoSiswa = () => {
    const c = canvasRef.current, v = videoRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setFotoDataUrl(c.toDataURL('image/jpeg', 0.7));
    setFotoDiambil(true);
    v.srcObject.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };
  const startKameraGuru = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoGuruRef.current.srcObject = stream;
      setCameraGuruActive(true);
    } catch { alert('Kamera tidak bisa diakses.'); }
  };
  const ambilFotoGuru = () => {
    const c = canvasGuruRef.current, v = videoGuruRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setFotoGuruDataUrl(c.toDataURL('image/jpeg', 0.7));
    setFotoGuruDiambil(true);
    v.srcObject.getTracks().forEach(t => t.stop());
    setCameraGuruActive(false);
  };
  const updateSiswaForm = (k, v) => setSiswaForm(p => ({ ...p, [k]: v }));
  const updateGuruForm = (k, v) => setGuruForm(p => ({ ...p, [k]: v }));

  const registrasiSiswa = async () => {
    const f = siswaForm;
    if (!f.nisn||!f.nama||!f.tglLahir||!f.email||!f.telpon||!f.agama||!f.password||!f.konfirmasi||!f.kelas||!f.jurusan||!f.citaCita||!f.hobby||!f.bio) { setSiswaError('Semua field wajib diisi!'); return; }
    if (f.password !== f.konfirmasi) { setSiswaError('Password tidak cocok!'); return; }
    if (f.password.length < 6) { setSiswaError('Password minimal 6 karakter!'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, role: 'siswa', status: 'pending', nisn: f.nisn, nama: f.nama,
        tglLahir: f.tglLahir, email: f.email, telpon: f.telpon, agama: f.agama, kelas: f.kelas,
        jurusan: f.jurusan, citaCita: f.citaCita, hobby: f.hobby, bio: f.bio, fotoUrl: fotoDataUrl || '',
        poinPG: 0, poinEssay: 0, poinModul: 0, totalPoin: 0, pelanggaran: 0, createdAt: new Date()
      });
      // Index minimal NISN → email supaya proses login (sebelum user ter-autentikasi)
      // tidak perlu query ke collection 'users' yang isinya data pribadi lengkap.
      await setDoc(doc(db, 'loginIndex', 'siswa_' + f.nisn), { email: f.email });
      await signOut(auth);
      setSiswaError('');
      setPage('menunggu');
    } catch (e) { setSiswaError(e.message.includes('email-already-in-use') ? 'Email sudah terdaftar!' : 'Gagal: ' + e.message); }
    setLoading(false);
  };

  const registrasiGuru = async () => {
    const f = guruForm;
    if (!f.nama||!f.namaPanggilan||!f.mapel||!f.jabatan||!f.email||!f.telpon||!f.password||!f.konfirmasi||!f.bio) { setGuruError('Semua field wajib diisi!'); return; }
    if (!f.nip && !f.nik) { setGuruError('NIP atau NIK wajib diisi!'); return; }
    if (f.password !== f.konfirmasi) { setGuruError('Password tidak cocok!'); return; }
    if (f.password.length < 6) { setGuruError('Password minimal 6 karakter!'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, role: 'guru', status: 'pending', nip: f.nip || '', nik: f.nik || '',
        nama: f.nama, namaPanggilan: f.namaPanggilan, mapel: f.mapel, mapelList: [f.mapel], jabatan: f.jabatan,
        email: f.email, telpon: f.telpon, bio: f.bio, fotoUrl: fotoGuruDataUrl || '',
        poinUpload: 0, poinNilai: 0, pelanggaran: 0, createdAt: new Date()
      });
      // Index minimal NIP/NIK → email, sama alasannya kayak siswa di atas.
      if (f.nip) await setDoc(doc(db, 'loginIndex', 'guru_' + f.nip), { email: f.email });
      if (f.nik) await setDoc(doc(db, 'loginIndex', 'guru_' + f.nik), { email: f.email });
      await signOut(auth);
      setGuruError('');
      setPage('menunggu');
    } catch (e) { setGuruError(e.message.includes('email-already-in-use') ? 'Email sudah terdaftar!' : 'Gagal: ' + e.message); }
    setLoading(false);
  };

  const loginSiswa = async () => {
    if (!siswaLoginNISN || !siswaLoginPassword) { setLoginError('NISN dan password wajib diisi!'); return; }
    setLoading(true); setLoginError('');
    try {
      const idxSnap = await getDoc(doc(db, 'loginIndex', 'siswa_' + siswaLoginNISN));
      if (!idxSnap.exists()) { setLoginError('NISN tidak ditemukan!'); setLoading(false); return; }
      const cred = await signInWithEmailAndPassword(auth, idxSnap.data().email, siswaLoginPassword);
      const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!docSnap.exists()) { await signOut(auth); setLoginError('Data akun tidak ditemukan.'); setLoading(false); return; }
      const siswaData = docSnap.data();
      if (siswaData.status === 'pending') { await signOut(auth); setLoginError('Akun belum disetujui admin!'); setLoading(false); return; }
      if (siswaData.status === 'rejected') { await signOut(auth); setLoginError('Akun ditolak.'); setLoading(false); return; }
      setUserData(siswaData); setUserRole('siswa');
      if (!siswaData.passwordChanged) { goTo('gantiPasswordPertama'); }
      else if (!siswaData.profileComplete) { setLengkapForm({ jenisKelamin: siswaData.jenisKelamin||'', agama: siswaData.agama||'Islam', kewarganegaraan: siswaData.kewarganegaraan||'WNI', email: siswaData.email||'', telpon: siswaData.telpon||'', bio: '', namaPanggilan: '' }); goTo('lengkapiProfil'); }
      else goTo('dashboard');
    } catch (e) { setLoginError('NISN atau password salah!'); }
    setLoading(false);
  };

  const loginGuru = async () => {
    if (!guruLoginNIP || !guruLoginPassword) { setLoginError('NIP/NIK dan password wajib diisi!'); return; }
    setLoading(true); setLoginError('');
    try {
      const idxSnap = await getDoc(doc(db, 'loginIndex', 'guru_' + guruLoginNIP));
      if (!idxSnap.exists()) { setLoginError('NIP/NIK tidak ditemukan!'); setLoading(false); return; }
      const cred = await signInWithEmailAndPassword(auth, idxSnap.data().email, guruLoginPassword);
      const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!docSnap.exists()) { await signOut(auth); setLoginError('Data akun tidak ditemukan.'); setLoading(false); return; }
      const guruData = docSnap.data();
      if (guruData.status === 'pending') { await signOut(auth); setLoginError('Akun belum disetujui admin!'); setLoading(false); return; }
      if (guruData.status === 'rejected') { await signOut(auth); setLoginError('Akun ditolak.'); setLoading(false); return; }
      setUserData(guruData); setUserRole('guru');
      if (!guruData.passwordChanged) { goTo('gantiPasswordPertama'); }
      else if (!guruData.profileComplete) { setLengkapForm({ jenisKelamin: guruData.jenisKelamin||'', agama: guruData.agama||'Islam', kewarganegaraan: guruData.kewarganegaraan||'WNI', email: guruData.email||'', telpon: guruData.telpon||'', bio: guruData.bio||'', namaPanggilan: guruData.namaPanggilan||'' }); goTo('lengkapiProfil'); }
      else goTo('dashboard');
    } catch (e) { setLoginError('NIP/NIK atau password salah!'); }
    setLoading(false);
  };

  // Admin functions
  const loginAdmin = async () => {
    if (!adminEmail || !adminPassword) { setAdminError('Email dan password wajib diisi!'); return; }
    setLoading(true); setAdminError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
      const data = docSnap.exists() ? docSnap.data() : null;
      if (!data || data.role !== 'admin' || data.status !== 'approved') {
        await signOut(auth);
        setAdminError('Akun ini tidak memiliki akses admin.');
        setLoading(false);
        return;
      }
      setUserData(data); setUserRole('admin');
      setAdminError(''); loadAdminUsers('pending'); setAdminTab('pending'); goTo('adminDashboard');
    } catch (e) {
      setAdminError('Email atau password admin salah!');
    }
    setLoading(false);
  };

  const loadAdminUsers = async (status) => {
    setAdminLoading(true);
    try {
      let snap;
      if (status === 'all') snap = await getDocs(collection(db, 'users'));
      else if (status === 'approved') snap = await getDocs(query(collection(db, 'users'), where('status', '==', 'approved')));
      else snap = await getDocs(query(collection(db, 'users'), where('status', '==', status)));
      setAdminUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setAdminLoading(false);
  };

  const approveUserRBAC = async (uid, nama) => {
    await updateDoc(doc(db, 'users', uid), { status: 'approved' });
    await catatAktivitas('APPROVE_USER', `Menyetujui: ${nama}`);
    setAdminMsg('✅ Akun disetujui!');
    setAdminUsers(prev => prev.filter(u => u.uid !== uid));
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const rejectUserRBAC = async (uid, nama) => {
    await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
    await catatAktivitas('REJECT_USER', `Menolak: ${nama}`);
    setAdminMsg('❌ Akun ditolak!');
    setAdminUsers(prev => prev.filter(u => u.uid !== uid));
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const hapusUserRBAC = async (uid, nama) => {
    if (!window.confirm('Yakin hapus?')) return;
    await deleteDoc(doc(db, 'users', uid));
    await catatAktivitas('DELETE_USER', `Menghapus: ${nama}`);
    setAdminMsg('🗑️ User dihapus!');
    setAdminUsers(prev => prev.filter(u => u.uid !== uid));
    setSelectedUser(null);
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const resetPasswordRBAC = async (email) => {
    const actionSettings = { url: window.location.origin, handleCodeInApp: false };
    try {
      await sendPasswordResetEmail(auth, email, actionSettings);
      await catatAktivitas('RESET_PASSWORD', `Reset: ${email}`);
      setAdminMsg('📧 Email reset terkirim ke ' + email + '. Minta pengguna cek kotak masuk (termasuk folder Spam).');
    } catch (e) {
      if (e.code === 'auth/user-not-found') setAdminMsg('❌ Email tidak terdaftar di sistem.');
      else if (e.code === 'auth/invalid-email') setAdminMsg('❌ Format email tidak valid.');
      else setAdminMsg('❌ Gagal: ' + e.message);
    }
    setTimeout(() => setAdminMsg(''), 5000);
  };

  const simpanEditPoinRBAC = async (uid, nama) => {
    const p = editPoinForm;
    const updateData = {};
    if (p.poinPG !== undefined) updateData.poinPG = Number(p.poinPG);
    if (p.poinEssay !== undefined) updateData.poinEssay = Number(p.poinEssay);
    if (p.poinModul !== undefined) updateData.poinModul = Number(p.poinModul);
    if (p.poinUpload !== undefined) updateData.poinUpload = Number(p.poinUpload);
    if (p.poinNilai !== undefined) updateData.poinNilai = Number(p.poinNilai);
    if (p.pelanggaran !== undefined) updateData.pelanggaran = Number(p.pelanggaran);
    // totalPoin dijaga selalu sinkron — ini yang dipakai Leaderboard biar query-nya murah.
    if (p.poinPG !== undefined || p.poinEssay !== undefined || p.poinModul !== undefined) {
      const target = adminUsers.find(u => u.uid === uid) || selectedUser || {};
      updateData.totalPoin = (updateData.poinPG ?? target.poinPG ?? 0) + (updateData.poinEssay ?? target.poinEssay ?? 0) + (updateData.poinModul ?? target.poinModul ?? 0);
    }
    await updateDoc(doc(db, 'users', uid), updateData);
    await catatAktivitas('EDIT_POIN', `Edit poin ${nama}`);
    setAdminMsg('✅ Poin diperbarui!');
    setAdminUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updateData } : u));
    setSelectedUser(prev => ({ ...prev, ...updateData }));
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const simpanAppSettings = async () => {
    await setDoc(doc(db, 'settings', 'app'), appSettings);
    setAdminMsg('✅ Pengaturan tersimpan!');
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const catatAktivitas = async (aksi, detail = '') => {
    try {
      await addDoc(collection(db, 'auditLog'), {
        aktor: 'Admin', role: 'admin', aksi, detail,
        timestamp: new Date(), waktu: new Date().toLocaleString('id-ID')
      });
    } catch (e) { console.error(e); }
  };

  const loadAuditLog = async () => {
    setAuditLoading(true);
    try {
      const snap = await getDocs(collection(db, 'auditLog'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setAuditLog(list.slice(0, 100));
    } catch (e) { console.error(e); }
    setAuditLoading(false);
  };

  const loadAdminStats = async () => {
    setAdminStatsLoading(true);
    try {
      const [userSnap, diskusiSnap, quizSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'diskusi')),
        getDocs(collection(db, 'hasilQuiz'))
      ]);
      const users = userSnap.docs.map(d => d.data());
      const siswaAktif = users.filter(u => u.role === 'siswa' && u.status === 'approved');
      const guruAktif = users.filter(u => u.role === 'guru' && u.status === 'approved');
      const pending = users.filter(u => u.status === 'pending');
      const totalPoin = siswaAktif.reduce((acc, s) => acc + (s.poinPG||0) + (s.poinEssay||0) + (s.poinModul||0), 0);
      await catatAktivitas('LIHAT_STATISTIK', 'Dashboard statistik');
      setAdminStats({
        siswaAktif: siswaAktif.length, guruAktif: guruAktif.length, pending: pending.length,
        totalDiskusi: diskusiSnap.size, totalQuiz: quizSnap.size,
        avgPoin: siswaAktif.length ? Math.round(totalPoin / siswaAktif.length) : 0,
        totalUser: users.length
      });
    } catch (e) { console.error(e); }
    setAdminStatsLoading(false);
  };

  const loadTahunAjaran = async () => {
    setMasterLoading(true);
    try {
      const snap = await getDocs(collection(db, 'tahunAjaran'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => b.tahun.localeCompare(a.tahun));
      setTahunAjaranList(list);
    } catch (e) { console.error(e); }
    setMasterLoading(false);
  };

  const tambahTahunAjaran = async () => {
    if (!tahunAjaranForm.tahun.trim()) { setAdminMsg('❌ Tahun ajaran wajib!'); return; }
    try {
      if (tahunAjaranForm.aktif) {
        const snap = await getDocs(collection(db, 'tahunAjaran'));
        for (const d of snap.docs) await updateDoc(doc(db, 'tahunAjaran', d.id), { aktif: false });
      }
      await addDoc(collection(db, 'tahunAjaran'), { ...tahunAjaranForm, tahun: tahunAjaranForm.tahun.trim(), createdAt: new Date() });
      await catatAktivitas('TAMBAH_TAHUN_AJARAN', tahunAjaranForm.tahun);
      setAdminMsg('✅ Tahun ajaran ditambahkan!');
      setTahunAjaranForm({ tahun: '', semester: '1', aktif: false });
      loadTahunAjaran();
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const hapusTahunAjaran = async (id, tahun) => {
    if (!window.confirm('Hapus?')) return;
    await deleteDoc(doc(db, 'tahunAjaran', id));
    await catatAktivitas('HAPUS_TAHUN_AJARAN', tahun);
    setAdminMsg('🗑️ Dihapus!');
    loadTahunAjaran();
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const setAktifTahunAjaran = async (id, tahun) => {
    const snap = await getDocs(collection(db, 'tahunAjaran'));
    for (const d of snap.docs) await updateDoc(doc(db, 'tahunAjaran', d.id), { aktif: d.id === id });
    await catatAktivitas('SET_AKTIF_TAHUN_AJARAN', tahun);
    setAdminMsg('✅ Diaktifkan!');
    loadTahunAjaran();
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const loadKelas = async () => {
    setMasterLoading(true);
    try {
      const snap = await getDocs(collection(db, 'masterKelas'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => `${a.tingkat}${a.jurusan}`.localeCompare(`${b.tingkat}${b.jurusan}`));
      setKelasList(list);
    } catch (e) { console.error(e); }
    setMasterLoading(false);
  };

  const tambahKelas = async () => {
    try {
      const exists = kelasList.find(k => k.tingkat === kelasForm.tingkat && k.jurusan === kelasForm.jurusan);
      if (exists) { setAdminMsg('❌ Sudah ada!'); return; }
      await addDoc(collection(db, 'masterKelas'), { ...kelasForm, createdAt: new Date() });
      await catatAktivitas('TAMBAH_KELAS', `${kelasForm.tingkat}${kelasForm.jurusan}`);
      setAdminMsg('✅ Kelas ditambahkan!');
      setKelasForm({ tingkat: '10', jurusan: 'A', waliKelas: '' });
      loadKelas();
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const hapusKelas = async (id, label) => {
    if (!window.confirm(`Hapus kelas ${label}?`)) return;
    await deleteDoc(doc(db, 'masterKelas', id));
    await catatAktivitas('HAPUS_KELAS', label);
    setAdminMsg('🗑️ Dihapus!');
    loadKelas();
    setTimeout(() => setAdminMsg(''), 3000);
  };

  // Sekali-jalan: bikinkan entri loginIndex (NISN/NIP/NIK → email) untuk akun
  // yang sudah terdaftar SEBELUM fitur login yang lebih aman ini dipasang.
  // Aman dijalankan berkali-kali (skip yang sudah ada).
  const sinkronkanLoginIndex = async () => {
    if (!window.confirm('Sinkronkan akun lama (login, mapel guru, & poin leaderboard)?')) return;
    setMigrasiLoading(true);
    let dibuat = 0, dilewati = 0, mapelDiisi = 0, poinDiisi = 0;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const mapelSnap = await getDocs(collection(db, 'masterMapel'));
      const semuaMapel = mapelSnap.docs.map(d => d.data());

      for (const d of snap.docs) {
        const u = d.data();
        if (!u.email) continue;
        const keys = [];
        if (u.role === 'siswa' && u.nisn) keys.push('siswa_' + u.nisn);
        if (u.role === 'guru' && u.nip) keys.push('guru_' + u.nip);
        if (u.role === 'guru' && u.nik) keys.push('guru_' + u.nik);
        for (const key of keys) {
          const existing = await getDoc(doc(db, 'loginIndex', key));
          if (existing.exists()) { dilewati++; continue; }
          await setDoc(doc(db, 'loginIndex', key), { email: u.email });
          dibuat++;
        }
        // Hitung ULANG mapelList tiap guru langsung dari masterMapel (sumber kebenaran).
        // Ini membenarkan sendiri data yang sempat berantakan dari versi sebelumnya.
        if (u.role === 'guru') {
          const dariMasterMapel = semuaMapel.filter(m => m.guruId === d.id).map(m => m.nama);
          const finalList = dariMasterMapel.length > 0 ? dariMasterMapel : (u.mapel ? [u.mapel] : []);
          await updateDoc(doc(db, 'users', d.id), { mapelList: finalList });
          mapelDiisi++;
        }
        // Siswa lama belum punya field totalPoin — tanpa ini, Leaderboard versi
        // hemat-baca gak akan nampilin mereka sama sekali. Hitung & isi sekarang.
        if (u.role === 'siswa' && u.totalPoin === undefined) {
          const total = (u.poinPG || 0) + (u.poinEssay || 0) + (u.poinModul || 0);
          await updateDoc(doc(db, 'users', d.id), { totalPoin: total });
          poinDiisi++;
        }
      }
      await catatAktivitas('SINKRON_LOGIN_INDEX', `${dibuat} login dibuat, ${mapelDiisi} mapelList dihitung ulang, ${poinDiisi} totalPoin diisi, ${dilewati} login dilewati`);
      setAdminMsg(`✅ Sinkron selesai! ${dibuat} login dipulihkan, ${mapelDiisi} guru di-hitung ulang mapelnya, ${poinDiisi} siswa siap tampil di Leaderboard, ${dilewati} login sudah OK sebelumnya.`);
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
    setMigrasiLoading(false);
    setTimeout(() => setAdminMsg(''), 5000);
  };

  const loadMapelAdmin = async () => {
    setMapelLoading(true);
    try {
      const snap = await getDocs(collection(db, 'masterMapel'));
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const idYangSudahAda = new Set(list.map(m => m.id));
      // Lengkapi mapel BAWAAN yang masih kurang di Firestore — TIDAK menyentuh
      // mapel yang sudah ada (termasuk yang custom kayak Bahasa Jerman).
      const kurang = mapelList
        .filter(m => !idYangSudahAda.has('mapel_' + m.id))
        .map(m => ({ ...m, id: 'mapel_' + m.id, guruId: '', guruNama: '', urutan: m.id }));
      if (kurang.length > 0) {
        await Promise.all(kurang.map(m => setDoc(doc(db, 'masterMapel', m.id), m)));
        list = [...list, ...kurang];
      }
      list.sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999));
      setMapelEditList(list);
      const guruSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'guru'), where('status', '==', 'approved')));
      setGuruListForMapel(guruSnap.docs.map(d => d.data()));
    } catch (e) { console.error(e); }
    setMapelLoading(false);
  };

  // Hanya BACA daftar mapel aktif (dipakai Forum Belajar & form daftar guru).
  // Tidak menulis apa pun, supaya siswa/guru biasa tidak butuh izin tulis ke masterMapel.
  const loadMapelAktif = async () => {
    try {
      const snap = await getDocs(collection(db, 'masterMapel'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setMapelAktif(list);
      }
    } catch (e) { console.error(e); }
  };

  const simpanMapel = async (mapelItem) => {
    try {
      const id = mapelItem.id?.startsWith('mapel_') ? mapelItem.id : 'mapel_' + mapelItem.id;
      await setDoc(doc(db, 'masterMapel', id), { ...mapelItem, id });
      await catatAktivitas('EDIT_MAPEL', `${mapelItem.nama} → ${mapelItem.guruNama || '-'}`);
      setAdminMsg('✅ Mapel disimpan!');
      setTimeout(() => setAdminMsg(''), 2000);
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
  };

  // Cuma update state lokal (form), belum nulis ke Firestore — biar ada tombol Simpan eksplisit.
  const pilihGuruMapel = (idx, guruId) => {
    const guru = guruListForMapel.find(g => g.uid === guruId);
    const updated = [...mapelEditList];
    updated[idx] = { ...updated[idx], guruId: guruId || '', guruNama: guru?.nama || '' };
    setMapelEditList(updated);
  };

  const ubahNamaMapel = (idx, namaBaru) => {
    const updated = [...mapelEditList];
    updated[idx] = { ...updated[idx], nama: namaBaru };
    setMapelEditList(updated);
  };

  // Tombol "💾 Simpan" per kartu mapel — commit nama + guru sekaligus.
  // PENTING: akses guru ke Forum Belajar ditentukan dari field `mapel` di
  // PROFIL guru sendiri (users/{uid}.mapel), bukan dari kartu mapel ini.
  // Makanya assign guru di sini harus ikut nulis ke profil guru itu juga.
  // Hitung ULANG mapelList satu guru, langsung dari masterMapel (sumber kebenaran
  // tunggal: "siapa guruId di tiap kartu mapel"). Ini SELALU benar, gak akan pernah
  // ketimpa/ketinggalan kayak pendekatan tambah-satu-satu sebelumnya.
  const hitungUlangMapelGuru = async (guruId) => {
    if (!guruId) return;
    const qSnap = await getDocs(query(collection(db, 'masterMapel'), where('guruId', '==', guruId)));
    const daftar = qSnap.docs.map(d => d.data().nama);
    await updateDoc(doc(db, 'users', guruId), { mapelList: daftar });
  };

  const simpanSatuMapel = async (idx) => {
    const item = mapelEditList[idx];
    if (!item.nama || !item.nama.trim()) { setAdminMsg('❌ Nama mapel tidak boleh kosong!'); setTimeout(() => setAdminMsg(''), 2000); return; }
    try {
      const before = await getDoc(doc(db, 'masterMapel', item.id));
      const guruSebelumnya = before.exists() ? (before.data().guruId || '') : '';

      await simpanMapel(item);

      // Hitung ulang mapelList guru yang terlibat (baru & lama kalau beda),
      // langsung dari masterMapel — jadi gak mungkin ada mapel yang "hilang".
      const terlibat = [item.guruId, guruSebelumnya].filter((v, i, arr) => v && arr.indexOf(v) === i);
      for (const gid of terlibat) await hitungUlangMapelGuru(gid);
    } catch (e) { setAdminMsg('❌ Gagal sinkron akses guru: ' + e.message); setTimeout(() => setAdminMsg(''), 3000); }
  };

  const hapusMapelItem = async (idx) => {
    const item = mapelEditList[idx];
    if (!window.confirm(`Hapus mapel "${item.nama}"? Materi/bab yang sudah ada di mapel ini TIDAK ikut terhapus otomatis.`)) return;
    try {
      await deleteDoc(doc(db, 'masterMapel', item.id));
      await catatAktivitas('HAPUS_MAPEL', item.nama);
      if (item.guruId) await hitungUlangMapelGuru(item.guruId);
      setMapelEditList(prev => prev.filter((_, i) => i !== idx));
      setAdminMsg('🗑️ Mapel dihapus!');
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setAdminMsg(''), 2000);
  };

  const simpanEditProfil = async () => {
    if (!userData) return;
    const updateData = { bio: editBioForm.bio.trim() || userData.bio || '' };
    if (userRole === 'siswa') {
      updateData.citaCita = editBioForm.citaCita.trim() || userData.citaCita || '';
      updateData.hobby = editBioForm.hobby.trim() || userData.hobby || '';
    }
    if (userRole === 'guru' && editBioForm.telpon !== undefined) {
      updateData.telpon = editBioForm.telpon.trim() || userData.telpon || '';
    }
    if (selectedAvatar) updateData.avatar = selectedAvatar;
    else if (userData.avatar) updateData.avatar = userData.avatar;
    try {
      await updateDoc(doc(db, 'users', userData.uid), updateData);
      setUserData(prev => ({ ...prev, ...updateData }));
      setPengaturanMsg('✅ Profil diperbarui!');
    } catch (e) { setPengaturanMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setPengaturanMsg(''), 3000);
  };

  const gantiPassword = async () => {
    const actionSettings = { url: window.location.origin, handleCodeInApp: false };
    try {
      await sendPasswordResetEmail(auth, userData.email, actionSettings);
      setPengaturanMsg('📧 Link reset dikirim ke ' + userData.email + '. Cek kotak masuk Gmail (termasuk folder Spam), klik link di email, lalu login pakai password baru.');
    } catch (e) {
      if (e.code === 'auth/too-many-requests') setPengaturanMsg('❌ Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.');
      else setPengaturanMsg('❌ Gagal: ' + e.message);
    }
    setTimeout(() => setPengaturanMsg(''), 8000);
  };

  // Ganti password langsung dari Pengaturan: masukin password lama buat verifikasi,
  // lalu password baru langsung aktif — tanpa perlu cek email sama sekali.
  const gantiPasswordSendiri = async () => {
    if (!gantiPwForm.lama || !gantiPwForm.baru || !gantiPwForm.konfirmasi) { setPengaturanMsg('❌ Semua kolom wajib diisi!'); setTimeout(() => setPengaturanMsg(''), 3000); return; }
    if (gantiPwForm.baru !== gantiPwForm.konfirmasi) { setPengaturanMsg('❌ Konfirmasi password baru tidak cocok!'); setTimeout(() => setPengaturanMsg(''), 3000); return; }
    if (gantiPwForm.baru.length < 6) { setPengaturanMsg('❌ Password baru minimal 6 karakter!'); setTimeout(() => setPengaturanMsg(''), 3000); return; }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, gantiPwForm.lama);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, gantiPwForm.baru);
      setGantiPwForm({ lama: '', baru: '', konfirmasi: '' });
      setPengaturanMsg('✅ Password berhasil diganti! Dipakai mulai login berikutnya.');
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setPengaturanMsg('❌ Password lama salah!');
      else setPengaturanMsg('❌ Gagal: ' + e.message);
    }
    setTimeout(() => setPengaturanMsg(''), 4000);
  };

  const loadAbout = async () => {
    if (aboutLoaded) return;
    try {
      const snap = await getDoc(doc(db, 'settings', 'about'));
      if (snap.exists()) setAboutData(prev => ({ ...prev, ...snap.data() }));
      setAboutLoaded(true);
    } catch (e) { console.error(e); }
  };

  const simpanAbout = async () => {
    try {
      await setDoc(doc(db, 'settings', 'about'), aboutData);
      setAdminMsg('✅ Halaman Tentang disimpan!');
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setAdminMsg(''), 3000);
  };

  // Upload foto langsung dari HP/laptop admin — gak perlu cari "link URL foto" lagi.
  // Foto otomatis dikecilin & dikompres biar muat disimpan di Firestore.
  const uploadFotoAbout = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(field);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setAboutData(p => ({ ...p, [field]: dataUrl }));
        setUploadingFoto('');
      };
      img.onerror = () => setUploadingFoto('');
      img.src = ev.target.result;
    };
    reader.onerror = () => setUploadingFoto('');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const loadSiswaByKelas = async (tingkat, jurusan) => {
    setDaftarLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'siswa'), where('status', '==', 'approved'), where('kelas', '==', tingkat), where('jurusan', '==', jurusan));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => d.data());
      list.sort((a, b) => { const pA = (a.poinPG||0)+(a.poinEssay||0)+(a.poinModul||0); const pB = (b.poinPG||0)+(b.poinEssay||0)+(b.poinModul||0); return pB - pA; });
      setDaftarSiswaList(list);
    } catch (e) { console.error(e); }
    setDaftarLoading(false);
  };

  const loadLeaderboard = async () => {
    setDaftarLoading(true);
    try {
      // Narik LANGSUNG 50 siswa teratas dari database (bukan narik semua siswa lalu
      // dipotong di HP) — ini yang bikin fitur ini murah & aman dipakai ratusan siswa.
      const q = query(collection(db, 'users'), where('role', '==', 'siswa'), where('status', '==', 'approved'), orderBy('totalPoin', 'desc'), limit(50));
      const snap = await getDocs(q);
      setLeaderboard(snap.docs.map(d => d.data()));
    } catch (e) { console.error(e); }
    setDaftarLoading(false);
  };

  const loadSemuaGuru = async () => {
    setDaftarLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'guru'), where('status', '==', 'approved'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => d.data());
      list.sort((a, b) => a.nama.localeCompare(b.nama));
      setDaftarGuruList(list);
    } catch (e) { console.error(e); }
    setDaftarLoading(false);
  };

  // ── Pengumuman ────────────────────────────────────────────────
  const loadPengumuman = async () => {
    setPengumumanLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc')));
      setPengumumanList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setPengumumanLoading(false);
  };

  const kirimPengumuman = async () => {
    if (!pengumumanForm.judul.trim() || !pengumumanForm.isi.trim()) { setPengumumanMsg('❌ Judul dan isi wajib diisi!'); setTimeout(() => setPengumumanMsg(''), 2000); return; }
    try {
      const docRef = await addDoc(collection(db, 'pengumuman'), {
        ...pengumumanForm,
        pengirimId: userData.uid, pengirimNama: userData.nama,
        pengirimRole: userRole, createdAt: new Date(),
        waktu: new Date().toLocaleString('id-ID')
      });
      setPengumumanList(prev => [{ id: docRef.id, ...pengumumanForm, pengirimNama: userData.nama, pengirimRole: userRole, waktu: new Date().toLocaleString('id-ID') }, ...prev]);
      setPengumumanForm({ judul: '', isi: '', target: 'semua' });
      setPengumumanMsg('✅ Pengumuman terkirim!');
    } catch (e) { setPengumumanMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setPengumumanMsg(''), 3000);
  };

  const hapusPengumuman = async (id) => {
    if (!window.confirm('Hapus pengumuman ini?')) return;
    await deleteDoc(doc(db, 'pengumuman', id));
    setPengumumanList(prev => prev.filter(p => p.id !== id));
  };

  // ── Rekap Nilai Siswa ─────────────────────────────────────────
  const loadRekapNilaiSiswa = async () => {
    if (!userData) return;
    setRekapSiswaLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'hasilQuiz'), where('siswaId', '==', userData.uid)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setRekapSiswaList(list);
    } catch (e) { console.error(e); }
    setRekapSiswaLoading(false);
  };

  // ── #9 Upload foto profil (Base64, simpan ke Firestore) ───────────
  const handleUploadFotoProfil = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPengaturanMsg('❌ Ukuran foto maksimal 5MB!'); return; }
    setUploadFotoProfil(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize ke max 300px (foto profil kecil = hemat Firestore)
        const maxW = 300;
        const scale = Math.min(1, maxW / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setFotoProfilDataUrl(dataUrl);
        setUploadFotoProfil(false);
      };
      img.onerror = () => setUploadFotoProfil(false);
      img.src = ev.target.result;
    };
    reader.onerror = () => setUploadFotoProfil(false);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const simpanFotoProfil = async () => {
    if (!fotoProfilDataUrl || !userData) return;
    try {
      await updateDoc(doc(db, 'users', userData.uid), { fotoUrl: fotoProfilDataUrl });
      setUserData(prev => ({ ...prev, fotoUrl: fotoProfilDataUrl }));
      setFotoProfilDataUrl('');
      setPengaturanMsg('✅ Foto profil diperbarui!');
    } catch (e) { setPengaturanMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setPengaturanMsg(''), 3000);
  };

  // ── #10 Export nilai ke Excel (xlsx via CDN) ──────────────────────
  const exportNilaiExcel = async () => {
    await loadExcelJS();
    const ExcelJS = window.ExcelJS;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'E-JULU';
    const ws = wb.addWorksheet('Rekap Nilai', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'Mata Pelajaran', key: 'mapel',   width: 22 },
      { header: 'Bab',            key: 'bab',     width: 28 },
      { header: 'Tanggal',        key: 'tgl',     width: 14 },
      { header: 'Poin PG',        key: 'pg',      width: 11 },
      { header: 'Nilai Essay',    key: 'essay',   width: 14 },
      { header: 'Modul (mnt)',    key: 'modul',   width: 14 },
      { header: 'Video (mnt)',    key: 'video',   width: 14 },
      { header: 'Total Poin',     key: 'total',   width: 12 },
    ];
    const headerRow = ws.getRow(1);
    headerRow.height = 26;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top:{style:'thin',color:{argb:'FF34D399'}}, left:{style:'thin',color:{argb:'FF34D399'}}, bottom:{style:'medium',color:{argb:'FF6EE7B7'}}, right:{style:'thin',color:{argb:'FF34D399'}} };
    });
    const border = { top:{style:'thin',color:{argb:'FFD1FAE5'}}, left:{style:'thin',color:{argb:'FFD1FAE5'}}, bottom:{style:'thin',color:{argb:'FFD1FAE5'}}, right:{style:'thin',color:{argb:'FFD1FAE5'}} };
    rekapSiswaList.forEach((h, idx) => {
      const total = (h.poinPG||0) + (typeof h.nilaiEssay === 'number' ? Math.round(h.nilaiEssay/5) : 0);
      const row = ws.addRow({
        mapel: h.mapel||'-', bab: h.babJudul||'-',
        tgl: h.timestamp ? new Date(h.timestamp.seconds*1000).toLocaleDateString('id-ID') : '-',
        pg: h.poinPG||0,
        essay: h.nilaiEssay !== null && h.nilaiEssay !== undefined ? h.nilaiEssay : 'Belum dinilai',
        modul: h.modulDurasi||0, video: h.videoDurasi||0, total,
      });
      row.height = 19;
      const bg = idx%2===0 ? 'FFF0FDF4' : 'FFFFFFFF';
      row.eachCell({includeEmpty:true}, (cell, c) => {
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:bg} };
        cell.font = { size:10, name:'Calibri' };
        cell.alignment = { horizontal: c===1||c===2 ? 'left' : 'center', vertical:'middle' };
        cell.border = border;
        if (c===8) cell.font = { ...cell.font, bold:true, color:{argb:'FF065F46'} };
      });
    });
    // Baris total
    ws.addRow([]);
    const totalRow = ws.addRow({ mapel: 'TOTAL POIN', total: rekapSiswaList.reduce((s,h) => s+(h.poinPG||0)+(typeof h.nilaiEssay==='number'?Math.round(h.nilaiEssay/5):0), 0) });
    totalRow.getCell(1).font = { bold:true, size:11 };
    totalRow.getCell(8).font = { bold:true, size:12, color:{argb:'FF065F46'} };
    totalRow.getCell(8).fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFD1FAE5'} };
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`Rekap_Nilai_${userData?.nama||'Siswa'}_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  // Export nilai satu bab untuk guru (dari hasilSiswa)
  const exportNilaiGuruExcel = async () => {
    await loadExcelJS();
    const ExcelJS = window.ExcelJS;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'E-JULU';
    const ws = wb.addWorksheet('Hasil Siswa', { views: [{ state: 'frozen', ySplit: 2 }] });

    // Baris judul
    ws.mergeCells('A1:H1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `REKAP NILAI — ${(selectedMapel?.nama||'').toUpperCase()} — ${selectedBab?.judul||''} — KELAS ${selectedKelas?.tingkat}${selectedKelas?.jurusan}`;
    titleCell.font = { bold:true, size:12, color:{argb:'FFFFFFFF'}, name:'Calibri' };
    titleCell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1E3A8A'} };
    titleCell.alignment = { horizontal:'center', vertical:'middle' };
    ws.getRow(1).height = 30;

    ws.columns = [
      { key:'no',    width: 6  },
      { key:'nama',  width: 28 },
      { key:'kelas', width: 10 },
      { key:'pg',    width: 14 },
      { key:'essay', width: 16 },
      { key:'modul', width: 14 },
      { key:'video', width: 14 },
      { key:'tgl',   width: 14 },
    ];

    // Baris header kolom
    const colHeaders = ['No','Nama Siswa','Kelas','Poin PG (/20)','Nilai Essay (/100)','Modul (mnt)','Video (mnt)','Tanggal'];
    const hRow = ws.addRow(colHeaders);
    hRow.height = 24;
    hRow.eachCell(cell => {
      cell.font = { bold:true, color:{argb:'FFFFFFFF'}, size:10, name:'Calibri' };
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1D4ED8'} };
      cell.alignment = { horizontal:'center', vertical:'middle' };
      cell.border = { top:{style:'thin',color:{argb:'FF93C5FD'}}, left:{style:'thin',color:{argb:'FF93C5FD'}}, bottom:{style:'medium',color:{argb:'FFBFDBFE'}}, right:{style:'thin',color:{argb:'FF93C5FD'}} };
    });

    const border = { top:{style:'thin',color:{argb:'FFBFDBFE'}}, left:{style:'thin',color:{argb:'FFBFDBFE'}}, bottom:{style:'thin',color:{argb:'FFBFDBFE'}}, right:{style:'thin',color:{argb:'FFBFDBFE'}} };
    hasilSiswa.forEach((h, idx) => {
      const belumDinilai = h.nilaiEssay === null || h.nilaiEssay === undefined;
      const row = ws.addRow([
        idx+1, h.siswaNama||'-', h.siswaKelas||'-',
        h.poinPG||0,
        belumDinilai ? 'Belum dinilai' : h.nilaiEssay,
        h.modulDurasi||0, h.videoDurasi||0,
        h.timestamp ? new Date(h.timestamp.seconds*1000).toLocaleDateString('id-ID') : '-',
      ]);
      row.height = 19;
      const bg = idx%2===0 ? 'FFEFF6FF' : 'FFFFFFFF';
      row.eachCell({includeEmpty:true}, (cell, c) => {
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:bg} };
        cell.font = { size:10, name:'Calibri', color: belumDinilai && c===5 ? {argb:'FFEF4444'} : {argb:'FF0F172A'} };
        cell.alignment = { horizontal: c===2 ? 'left' : 'center', vertical:'middle' };
        cell.border = border;
      });
    });

    // Baris total
    ws.addRow([]);
    const totalRow = ws.addRow(['','RATA-RATA','',
      hasilSiswa.length ? Math.round(hasilSiswa.reduce((s,h)=>s+(h.poinPG||0),0)/hasilSiswa.length*10)/10 : 0,
      hasilSiswa.filter(h=>typeof h.nilaiEssay==='number').length
        ? Math.round(hasilSiswa.filter(h=>typeof h.nilaiEssay==='number').reduce((s,h)=>s+h.nilaiEssay,0)/hasilSiswa.filter(h=>typeof h.nilaiEssay==='number').length*10)/10
        : '-',
      '','','',
    ]);
    [1,2,3,4,5].forEach(c => {
      const cell = totalRow.getCell(c);
      cell.font = { bold:true, size:10, color:{argb:'FF1E3A8A'} };
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFDBEAFE'} };
      cell.border = border;
    });

    const namaFile = `Nilai_${selectedMapel?.nama||'Mapel'}_${selectedBab?.judul||'Bab'}_Kelas${selectedKelas?.tingkat}${selectedKelas?.jurusan}_${new Date().toLocaleDateString('id-ID').replace(/\//g,'-')}.xlsx`;
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=namaFile; a.click();
    URL.revokeObjectURL(url);
  };

  // ── #11 Kalender Akademik ─────────────────────────────────────────
  const loadKalender = async () => {
    setKalenderLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'kalender'), orderBy('tanggal', 'asc')));
      setKalenderList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setKalenderLoading(false);
  };

  const tambahKalender = async () => {
    if (!kalenderForm.judul.trim() || !kalenderForm.tanggal) {
      setKalenderMsg('❌ Judul dan tanggal wajib diisi!'); setTimeout(() => setKalenderMsg(''), 2500); return;
    }
    try {
      const docRef = await addDoc(collection(db, 'kalender'), {
        ...kalenderForm, buatOlehId: userData.uid, buatOlehNama: userData.nama,
        buatOlehRole: userRole, createdAt: new Date()
      });
      await catatAktivitas('TAMBAH_KALENDER', kalenderForm.judul);
      setKalenderList(prev => [...prev, { id: docRef.id, ...kalenderForm }].sort((a, b) => a.tanggal.localeCompare(b.tanggal)));
      setKalenderForm({ judul: '', tanggal: '', tanggalAkhir: '', tipe: 'umum', deskripsi: '' });
      setKalenderMsg('✅ Kegiatan ditambahkan!');
    } catch (e) { setKalenderMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setKalenderMsg(''), 3000);
  };

  const hapusKalender = async (id, judul) => {
    if (!window.confirm(`Hapus "${judul}"?`)) return;
    await deleteDoc(doc(db, 'kalender', id));
    await catatAktivitas('HAPUS_KALENDER', judul);
    setKalenderList(prev => prev.filter(k => k.id !== id));
  };

  // ── Import massal guru ───────────────────────────────────────────
  const handleImportGuruExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!window.XLSX) {
      setImportGuruMsg('⏳ Memuat library...');
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    const XLSX = window.XLSX;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (data.length < 2) { setImportGuruMsg('❌ File kosong.'); return; }
        const h = data[0].map(x => String(x).toLowerCase().trim());
        const iNIP     = h.findIndex(x => x.includes('nip'));
        const iNIK     = h.findIndex(x => x.includes('nik'));
        const iNama    = h.findIndex(x => x.includes('nama') && !x.includes('panggil'));
        const iPanggil = h.findIndex(x => x.includes('panggil'));
        const iJabatan = h.findIndex(x => x.includes('jabatan'));
        const iMapel   = h.findIndex(x => x.includes('mapel') || x.includes('pelajaran') || x.includes('diampu'));
        if (iNama === -1) { setImportGuruMsg('❌ Kolom Nama wajib ada.'); return; }
        const rows = data.slice(1).map(cols => {
          // NIK/NIP bisa tersimpan sebagai angka di Excel — konversi ke string, buang desimal
          const nipRaw   = iNIP >= 0 && cols[iNIP] != null ? cols[iNIP] : '';
          const nikRaw   = iNIK >= 0 && cols[iNIK] != null ? cols[iNIK] : '';
          const nip      = nipRaw !== '' ? String(typeof nipRaw === 'number' ? Math.round(nipRaw) : nipRaw).trim() : '';
          const nik      = nikRaw !== '' ? String(typeof nikRaw === 'number' ? Math.round(nikRaw) : nikRaw).trim() : '';
          const nama     = iNama    >= 0 ? String(cols[iNama]    || '').trim() : '';
          const panggil  = iPanggil >= 0 ? String(cols[iPanggil] || '').trim() : '';
          const jabatan  = iJabatan >= 0 ? String(cols[iJabatan] || '').trim() : 'Guru';
          const mapelRaw = iMapel   >= 0 ? String(cols[iMapel]   || '').trim() : '';
          // mapelList: bisa dipisah koma/titik koma
          const mapelList = mapelRaw ? mapelRaw.split(/[,;]/).map(m => m.trim()).filter(Boolean) : [];
          const mapel = mapelList[0] || '';
          // login identifier: pakai NIP jika ada, else NIK, else nama (sanitized)
          const loginId = nip || nik || nama.toLowerCase().replace(/\s+/g, '.');
          const email = loginId.replace(/[^a-z0-9.]/gi, '') + '@ejulu.sch.id';
          const valid = !!(nama && (nip || nik));
          return { nip, nik, nama, namaPanggilan: panggil, jabatan, mapel, mapelList, email, valid };
        }).filter(r => r.nama);
        setImportGuruPreview(rows);
        const v = rows.filter(r => r.valid).length;
        const inv = rows.filter(r => !r.valid).length;
        setImportGuruMsg(`📋 ${v} guru siap diimport${inv > 0 ? `, ${inv} baris bermasalah (NIP/NIK kosong)` : ''}. Password default: ejulu123`);
      } catch (err) { setImportGuruMsg('❌ Gagal: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  const mulaiImportGuru = async () => {
    const valid = importGuruPreview.filter(r => r.valid);
    if (!valid.length) { setImportGuruMsg('❌ Tidak ada data valid.'); return; }
    setImportGuruLoading(true);
    // Secondary app — buat akun tanpa logout admin
    const secApp = getApps().find(a => a.name === 'sec') || initializeApp(firebaseConfig, 'sec');
    const secAuth = getAuth(secApp);
    let berhasil = 0, gagal = 0;
    for (let i = 0; i < valid.length; i++) {
      const g = valid[i];
      setImportGuruMsg(`⏳ ${i + 1}/${valid.length}: ${g.nama}...`);
      try {
        const loginId = (g.nip || g.nik || '').replace(/\s/g, '');
        if (!loginId) { gagal++; continue; }
        const email = loginId + '@ejulu.sch.id';
        const cred = await createUserWithEmailAndPassword(secAuth, email, 'ejulu123');
        const uid = cred.user.uid;
        await signOut(secAuth);
        await setDoc(doc(db, 'users', uid), {
          uid, role: 'guru', status: 'approved',
          nip: g.nip || '', nik: g.nik || '', nama: g.nama,
          namaPanggilan: g.namaPanggilan || '', jabatan: g.jabatan || 'Guru',
          mapel: g.mapel || '', mapelList: g.mapelList || [],
          email, telpon: '-', bio: '', agama: 'Islam',
          jenisKelamin: '', kewarganegaraan: 'WNI',
          passwordChanged: false, profileComplete: false,
          fotoUrl: '', avatar: '👨‍🏫', createdAt: new Date()
        });
        if (g.nip) await setDoc(doc(db, 'loginIndex', 'guru_' + g.nip.replace(/\s/g, '')), { email });
        if (g.nik) await setDoc(doc(db, 'loginIndex', 'guru_' + g.nik.replace(/\s/g, '')), { email });
        berhasil++;
      } catch (e) { gagal++; console.error(g.nama, e.message); }
      await new Promise(r => setTimeout(r, 200));
    }
    setImportGuruPreview([]);
    setAdminPassImport('');
    setImportGuruMsg(`✅ Selesai! ${berhasil} berhasil, ${gagal} gagal.`);
    setImportGuruLoading(false);
    setTimeout(() => setImportGuruMsg(''), 10000);
  };

  const downloadTemplateGuruExcel = async () => {
    await loadExcelJS();
    const ExcelJS = window.ExcelJS;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'E-JULU';
    const ws = wb.addWorksheet('Template Import Guru', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'NIP',             key: 'nip',     width: 22 },
      { header: 'NIK',             key: 'nik',     width: 20 },
      { header: 'Nama Lengkap',    key: 'nama',    width: 30 },
      { header: 'Nama Panggilan',  key: 'panggil', width: 18 },
      { header: 'Jabatan',         key: 'jabatan', width: 20 },
      { header: 'Mapel Diampu',    key: 'mapel',   width: 28 },
    ];
    // Set format Text untuk kolom NIP (A) dan NIK (B) agar tidak berubah jadi notasi ilmiah
    ws.getColumn('nip').numFmt = '@';
    ws.getColumn('nik').numFmt = '@';
    const hRow = ws.getRow(1);
    hRow.height = 28;
    hRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top:{style:'thin',color:{argb:'FFA78BFA'}}, left:{style:'thin',color:{argb:'FFA78BFA'}}, bottom:{style:'medium',color:{argb:'FFEDE9FE'}}, right:{style:'thin',color:{argb:'FFA78BFA'}} };
    });
    const contoh = [
      { nip:'197001011995011001', nik:'1234567890123456', nama:'Dr. Budi Santoso, M.Pd', panggil:'Pak Budi', jabatan:'Guru Mapel', mapel:'Matematika' },
      { nip:'',                  nik:'9876543210987654', nama:'Siti Rahayu, S.Pd',       panggil:'Bu Siti',  jabatan:'Guru Mapel', mapel:'Bahasa Indonesia' },
      { nip:'198505152010012002', nik:'1122334455667788', nama:'Ahmad Fauzan, S.T',       panggil:'Pak Ahmad',jabatan:'Guru Mapel', mapel:'Fisika' },
    ];
    // Paksa NIP dan NIK di baris contoh sebagai string (bukan number)
    contoh.forEach((_, idx) => {
      const rowNum = idx + 2; // baris data mulai dari 2
      ['nip','nik'].forEach(key => {
        const col = key === 'nip' ? 1 : 2;
        const cell = ws.getCell(rowNum, col);
        cell.numFmt = '@';
        if (cell.value) cell.value = String(cell.value);
      });
    });
    const border = { top:{style:'thin',color:{argb:'FFEDE9FE'}}, left:{style:'thin',color:{argb:'FFEDE9FE'}}, bottom:{style:'thin',color:{argb:'FFEDE9FE'}}, right:{style:'thin',color:{argb:'FFEDE9FE'}} };
    contoh.forEach((d, idx) => {
      const row = ws.addRow(d);
      row.height = 20;
      const bg = idx % 2 === 0 ? 'FFF5F3FF' : 'FFFFFFFF';
      row.eachCell({ includeEmpty: true }, (cell, c) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: c === 3 || c === 4 ? 'left' : 'center', vertical: 'middle' };
        cell.border = border;
      });
    });
    // 10 baris kosong
    for (let i = 0; i < 10; i++) {
      const row = ws.addRow({});
      row.height = 20;
      const bg = i % 2 === 0 ? 'FFF5F3FF' : 'FFFFFFFF';
      for (let c = 1; c <= 6; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = border;
      }
    }
    ws.addRow([]);
    const note = ws.addRow(['* NIP atau NIK wajib diisi minimal satu. Mapel bisa diisi lebih dari satu, pisahkan dengan koma. Password default: ejulu123']);
    note.getCell(1).font = { italic: true, color: { argb: 'FF64748B' }, size: 9 };
    ws.mergeCells(`A${note.number}:F${note.number}`);
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Template_Import_Guru_EJULU.xlsx'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Ganti password pertama kali ──────────────────────────────────
  const submitGantiPasswordPertama = async () => {
    if (!gantiPassBaru || gantiPassBaru.length < 6) { setGantiPassMsg('❌ Password minimal 6 karakter!'); return; }
    if (gantiPassBaru === 'ejulu123') { setGantiPassMsg('❌ Password baru tidak boleh sama dengan password default!'); return; }
    if (gantiPassBaru !== gantiPassKonfirm) { setGantiPassMsg('❌ Konfirmasi password tidak cocok!'); return; }
    setGantiPassLoading(true);
    try {
      const user = auth.currentUser;
      // Re-auth dengan password lama (ejulu123) - pakai import top-level
      const defaultPass = 'ejulu123';
      const cred = EmailAuthProvider.credential(user.email, defaultPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, gantiPassBaru);
      await updateDoc(doc(db, 'users', userData.uid), { passwordChanged: true });
      setUserData(prev => ({ ...prev, passwordChanged: true }));
      setGantiPassBaru(''); setGantiPassKonfirm(''); setGantiPassMsg('');
      // Langsung ke lengkapi profil
      setLengkapForm({ jenisKelamin: userData?.jenisKelamin||'', agama: userData?.agama||'Islam', kewarganegaraan: userData?.kewarganegaraan||'WNI', email: userData?.email||'', telpon: userData?.telpon||'', bio: userData?.bio||'', namaPanggilan: userData?.namaPanggilan||'' });
      goTo('lengkapiProfil');
    } catch (e) {
      setGantiPassMsg('❌ Gagal ganti password: ' + (e.code === 'auth/wrong-password' ? 'Autentikasi gagal, coba logout dan login ulang.' : e.message));
    }
    setGantiPassLoading(false);
  };

  const simpanLengkapProfil = async () => {
    if (!lengkapForm.jenisKelamin) { setLengkapMsg('❌ Jenis kelamin wajib dipilih!'); return; }
    if (!lengkapForm.email || !lengkapForm.email.includes('@')) { setLengkapMsg('❌ Email aktif wajib diisi!'); return; }
    if (!lengkapForm.telpon || lengkapForm.telpon.length < 8) { setLengkapMsg('❌ Nomor telepon tidak valid!'); return; }
    if (userRole === 'guru' && !lengkapForm.bio?.trim()) { setLengkapMsg('❌ Bio singkat wajib diisi untuk guru!'); return; }
    setLengkapLoading(true);
    try {
      const update = {
        jenisKelamin: lengkapForm.jenisKelamin,
        agama: lengkapForm.agama,
        kewarganegaraan: lengkapForm.kewarganegaraan,
        email: lengkapForm.email,
        telpon: lengkapForm.telpon,
        profileComplete: true,
      };
      if (userRole === 'guru') { update.bio = lengkapForm.bio || ''; update.namaPanggilan = lengkapForm.namaPanggilan || userData?.namaPanggilan || ''; }
      await updateDoc(doc(db, 'users', userData.uid), update);
      setUserData(prev => ({ ...prev, ...update }));
      goTo('dashboard');
    } catch (e) { setLengkapMsg('❌ Gagal simpan: ' + e.message); }
    setLengkapLoading(false);
  };

  // ── Badge pesan belum dibaca ───────────────────────────────────
  const loadPesanBadge = async () => {
    if (!userData || userRole !== 'siswa') return;
    try {
      const snap = await getDocs(query(collection(db, 'pesan'), where('siswaId', '==', userData.uid), where('pengirim', '==', 'guru'), where('dibaca', '==', false)));
      setPesanBadge(snap.size);
    } catch (e) { /* silent */ }
  };

  // ── Cek apakah siswa sudah pernah mengerjakan quiz bab ini ────
  const cekSudahQuiz = async (babId) => {
    if (!userData) return false;
    try {
      const snap = await getDocs(query(collection(db, 'hasilQuiz'), where('babId', '==', babId), where('siswaId', '==', userData.uid)));
      if (!snap.empty) {
        setQuizHasilLama(snap.docs[0].data());
        setQuizSudahPernah(true);
        return true;
      }
    } catch (e) { console.error(e); }
    setQuizSudahPernah(false);
    setQuizHasilLama(null);
    return false;
  };

  // ── Import massal siswa dari CSV ──────────────────────────────
  // Format CSV: NISN,Nama,Email,Password,Kelas,Jurusan,TglLahir,Agama,Telpon
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!window.XLSX) {
      setImportMsg('⏳ Memuat library Excel...');
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const XLSX = window.XLSX;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (data.length < 2) { setImportMsg('❌ File kosong atau tidak ada data.'); return; }
        const headerRow = data[0].map(h => String(h).toLowerCase().trim());
        const iNISN    = headerRow.findIndex(h => h.includes('nisn'));
        const iNama    = headerRow.findIndex(h => h.includes('nama'));
        const iKelas   = headerRow.findIndex(h => h.includes('kelas'));
        const iJurusan = headerRow.findIndex(h => h.includes('jurusan'));
        if (iNISN === -1 || iNama === -1) {
          setImportMsg('❌ Kolom NISN dan Nama wajib ada. Gunakan template yang disediakan.'); return;
        }
        const rows = data.slice(1).map(cols => {
          const nisn    = String(cols[iNISN]    || '').trim();
          const nama    = iNama    >= 0 ? String(cols[iNama]    || '').trim() : '';
          const kelas   = iKelas   >= 0 ? String(cols[iKelas]   || '').trim() : '';
          const jurusan = iJurusan >= 0 ? String(cols[iJurusan] || '').trim() : '';
          const email   = nisn + '@ejulu.sch.id';
          const password = 'ejulu123';
          const valid   = !!(nisn && nama && kelas && jurusan);
          return { nisn, nama, email, password, kelas, jurusan, tglLahir: '', agama: 'Islam', telpon: '-', valid };
        }).filter(r => r.nisn);
        setImportPreview(rows);
        const validCount = rows.filter(r => r.valid).length;
        const invalidCount = rows.filter(r => !r.valid).length;
        setImportMsg(`📋 ${validCount} siswa siap diimport${invalidCount > 0 ? `, ${invalidCount} baris bermasalah` : ''}. Password default: ejulu123`);
      } catch(err) {
        setImportMsg('❌ Gagal membaca file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const mulaiImport = async () => {
    const valid = importPreview.filter(r => r.valid);
    if (!valid.length) { setImportMsg('❌ Tidak ada baris data yang valid.'); return; }
    setImportLoading(true);
    // Secondary app — buat akun tanpa logout admin
    const secApp = getApps().find(a => a.name === 'sec') || initializeApp(firebaseConfig, 'sec');
    const secAuth = getAuth(secApp);
    let berhasil = 0, gagal = 0;
    for (let i = 0; i < valid.length; i++) {
      const s = valid[i];
      setImportMsg(`⏳ ${i + 1}/${valid.length}: ${s.nama}...`);
      try {
        const email = s.nisn.trim() + '@ejulu.sch.id';
        const cred = await createUserWithEmailAndPassword(secAuth, email, 'ejulu123');
        const uid = cred.user.uid;
        await signOut(secAuth);
        await setDoc(doc(db, 'users', uid), {
          uid, role: 'siswa', status: 'approved',
          nisn: s.nisn, nama: s.nama, email, kelas: s.kelas,
          jurusan: s.jurusan, tglLahir: s.tglLahir || '', agama: 'Islam', telpon: '-',
          jenisKelamin: '', kewarganegaraan: 'WNI',
          passwordChanged: false, profileComplete: false,
          citaCita: '', hobby: '', bio: '', fotoUrl: '', avatar: '🎓',
          poinPG: 0, poinEssay: 0, poinModul: 0, totalPoin: 0, pelanggaran: 0, createdAt: new Date()
        });
        await setDoc(doc(db, 'loginIndex', 'siswa_' + s.nisn.trim()), { email });
        berhasil++;
      } catch (e) { gagal++; console.error(s.nisn, e.message); }
      await new Promise(r => setTimeout(r, 200));
    }
    setImportPreview([]);
    setAdminPassSiswaImport('');
    setImportMsg(`✅ Selesai! ${berhasil} berhasil, ${gagal} gagal.`);
    setImportLoading(false);
    setTimeout(() => setImportMsg(''), 10000);
  };

  const loadExcelJS = () => new Promise((resolve, reject) => {
    if (window.ExcelJS) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  const downloadTemplateExcel = async () => {
    await loadExcelJS();
    const ExcelJS = window.ExcelJS;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'E-JULU'; wb.created = new Date();
    const ws = wb.addWorksheet('Template Import Siswa', { views: [{ state: 'frozen', ySplit: 1 }] });

    // Definisi kolom
    ws.columns = [
      { header: 'NISN',    key: 'nisn',    width: 16 },
      { header: 'Nama',    key: 'nama',    width: 30 },
      { header: 'Kelas',   key: 'kelas',   width: 8  },
      { header: 'Jurusan', key: 'jurusan', width: 10 },
    ];

    // Style baris header (baris 1)
    const headerRow = ws.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF3B82F6' } },
        left: { style: 'thin', color: { argb: 'FF3B82F6' } },
        bottom: { style: 'medium', color: { argb: 'FF93C5FD' } },
        right: { style: 'thin', color: { argb: 'FF3B82F6' } },
      };
    });

    // Data contoh
    const contoh = [
      { nisn:'1234567890', nama:'Budi Santoso',  kelas:'10', jurusan:'A' },
      { nisn:'0987654321', nama:'Siti Aminah',   kelas:'10', jurusan:'B' },
      { nisn:'1122334455', nama:'Ahmad Fauzi',   kelas:'11', jurusan:'A' },
      { nisn:'5544332211', nama:'Dewi Rahayu',   kelas:'11', jurusan:'B' },
      { nisn:'9988776655', nama:'Rizki Pratama', kelas:'12', jurusan:'A' },
    ];

    const borderThin = {
      top:    { style: 'thin', color: { argb: 'FFBFDBFE' } },
      left:   { style: 'thin', color: { argb: 'FFBFDBFE' } },
      bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      right:  { style: 'thin', color: { argb: 'FFBFDBFE' } },
    };

    contoh.forEach((d, idx) => {
      const row = ws.addRow(d);
      row.height = 20;
      const bgColor = idx % 2 === 0 ? 'FFEFF6FF' : 'FFFFFFFF';
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };
        cell.border = borderThin;
      });
    });

    // Baris kosong siap isi (10 baris)
    for (let i = 0; i < 10; i++) {
      const row = ws.addRow({});
      row.height = 20;
      const bgColor = i % 2 === 0 ? 'FFEFF6FF' : 'FFFFFFFF';
      row.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = borderThin;
      });
      // Buat 10 sel kosong per baris agar border tampil
      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = borderThin;
      }
    }

    // Baris keterangan di bawah
    ws.addRow([]);
    const noteRow = ws.addRow(['* Kolom wajib: NISN, Nama, Kelas, Jurusan. Password login semua siswa: ejulu123 (wajib diganti saat pertama login).']);
    noteRow.getCell(1).font = { italic: true, color: { argb: 'FF64748B' }, size: 9 };
    ws.mergeCells(`A${noteRow.number}:D${noteRow.number}`);

    // Download
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Template_Import_Siswa_EJULU.xlsx'; a.click();
    URL.revokeObjectURL(url);
  };

  const hitungTotalPoin = (u) => (u.poinPG||0) + (u.poinEssay||0) + (u.poinModul||0);

  // Guru bisa pegang LEBIH dari satu mapel. Cek ke mapelList (array) dulu;
  // kalau akun lama belum punya mapelList, jatuhkan ke field `mapel` (tunggal).
  const guruPunyaMapel = (namaMapel) => {
    if (!userData) return false;
    if (Array.isArray(userData.mapelList)) return userData.mapelList.includes(namaMapel);
    return userData.mapel === namaMapel;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', label: 'Rank #1', color: '#FFD700' };
    if (rank === 2) return { icon: '🥈', label: 'Rank #2', color: '#C0C0C0' };
    if (rank === 3) return { icon: '🥉', label: 'Rank #3', color: '#CD7F32' };
    if (rank <= 10) return { icon: '🌟', label: `Rank #${rank}`, color: '#4f46e5' };
    return { icon: '⭐', label: `Rank #${rank}`, color: '#94a3b8' };
  };

  const loadDiskusi = async (babId, kelasLabel) => {
    setDiskusiLoading(true);
    try {
      const q = query(collection(db, 'diskusi'), where('babId', '==', babId), where('kelas', '==', kelasLabel));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setDiskusiList(list);
    } catch (e) { console.error(e); }
    setDiskusiLoading(false);
  };

  const kirimDiskusi = async (babId, kelasLabel) => {
    if (!diskusiInput.trim()) return;
    const pesan = diskusiInput.trim();
    setDiskusiInput('');
    try {
      const docRef = await addDoc(collection(db, 'diskusi'), {
        babId, mapel: selectedMapel?.nama || '', babJudul: selectedBab?.judul || '',
        kelas: kelasLabel, pengirimId: userData.uid, pengirimNama: userData.nama,
        pengirimRole: userRole, pesan, timestamp: new Date()
      });
      setDiskusiList(prev => [...prev, { id: docRef.id, babId, kelas: kelasLabel, pengirimId: userData.uid, pengirimNama: userData.nama, pengirimRole: userRole, pesan, timestamp: { seconds: Date.now() / 1000 } }]);
    } catch (e) { console.error(e); }
  };

  const hapusDiskusi = async (pesanId, pengirimId) => {
    if (userRole === 'siswa' && pengirimId !== userData.uid) return;
    await deleteDoc(doc(db, 'diskusi', pesanId));
    setDiskusiList(prev => prev.filter(d => d.id !== pesanId));
    setDiskusiActionId(null);
  };

  const editDiskusi = async (pesanId, pesanBaru) => {
    if (!pesanBaru.trim()) return;
    await updateDoc(doc(db, 'diskusi', pesanId), { pesan: pesanBaru.trim(), diedit: true });
    setDiskusiList(prev => prev.map(d => d.id === pesanId ? { ...d, pesan: pesanBaru.trim(), diedit: true } : d));
    setDiskusiEditId(null); setDiskusiEditText(''); setDiskusiActionId(null);
  };

  const handleLongPressStart = (d) => {
    longPressTimer.current = setTimeout(() => {
      if (d.pengirimId === userData?.uid || userRole === 'guru') {
        setDiskusiActionId(d.id); setDiskusiEditText(d.pesan);
      }
    }, 600);
  };

  const handleLongPressEnd = () => { clearTimeout(longPressTimer.current); };

  const logout = async () => {
    await signOut(auth);
    setUserData(null); setUserRole(null); setLoginError('');
    setPage('role');
  };

  const tambahBab = async () => {
    if (!babBaru.trim()) return;
    const docRef = await addDoc(collection(db, 'bab'), { mapel: selectedMapel.nama, judul: babBaru, modul: '', modul2: '', video: '', urutan: babList.length + 1, createdAt: new Date() });
    setBabList(prev => [...prev, { id: docRef.id, mapel: selectedMapel.nama, judul: babBaru, modul: '', modul2: '', video: '', urutan: babList.length + 1 }]);
    setBabBaru('');
  };

  const hapusBab = async (babId) => { await deleteDoc(doc(db, 'bab', babId)); setBabList(prev => prev.filter(b => b.id !== babId)); };
  const simpanJudulBab = async (babId, judul) => { await updateDoc(doc(db, 'bab', babId), { judul }); setEditBab(null); };
  const simpanLinkBab = async (field) => {
    await updateDoc(doc(db, 'bab', selectedBab.id), { [field]: linkEdit[field] });
    setBabList(prev => prev.map(b => b.id === selectedBab.id ? { ...b, [field]: linkEdit[field] } : b));
    setSelectedBab(prev => ({ ...prev, [field]: linkEdit[field] }));
    alert('Link tersimpan!');
  };

  // #12 Simpan link file Google Drive per bab
  const simpanFileDrive = async () => {
    if (!linkEditDrive.trim()) return;
    await updateDoc(doc(db, 'bab', selectedBab.id), { fileDrive: linkEditDrive.trim() });
    setBabList(prev => prev.map(b => b.id === selectedBab.id ? { ...b, fileDrive: linkEditDrive.trim() } : b));
    setSelectedBab(prev => ({ ...prev, fileDrive: linkEditDrive.trim() }));
    alert('Link file Google Drive tersimpan!');
  };

  const hapusFileDrive = async () => {
    if (!window.confirm('Hapus link file Google Drive dari bab ini?')) return;
    await updateDoc(doc(db, 'bab', selectedBab.id), { fileDrive: '' });
    setBabList(prev => prev.map(b => b.id === selectedBab.id ? { ...b, fileDrive: '' } : b));
    setSelectedBab(prev => ({ ...prev, fileDrive: '' }));
    setLinkEditDrive('');
  };

  const tambahSoalPG = async () => {
    if (!soalBaru.soal.trim()) return;
    const docRef = await addDoc(collection(db, 'soal'), { babId: selectedBab.id, mapel: selectedMapel.nama, tipe: 'pg', soal: soalBaru.soal, opsi: soalBaru.opsi, kunci: soalBaru.kunci, createdAt: new Date() });
    setQuizSoalList(prev => [...prev, { id: docRef.id, ...soalBaru, babId: selectedBab.id }]);
    setSoalBaru({ tipe: 'pg', soal: '', opsi: ['A. ','B. ','C. ','D. ','E. '], kunci: 'A' });
  };

  const tambahSoalEssay = async () => {
    if (!essayBaru.trim()) return;
    const docRef = await addDoc(collection(db, 'soal'), { babId: selectedBab.id, mapel: selectedMapel.nama, tipe: 'essay', soal: essayBaru, opsi: [], kunci: '', createdAt: new Date() });
    setQuizSoalList(prev => [...prev, { id: docRef.id, tipe: 'essay', soal: essayBaru, babId: selectedBab.id }]);
    setEssayBaru('');
  };

  const hapusSoal = async (soalId) => { await deleteDoc(doc(db, 'soal', soalId)); setQuizSoalList(prev => prev.filter(s => s.id !== soalId)); };

  const simpanNilaiEssay = async (hasilId, nilai, index) => {
    await updateDoc(doc(db, 'hasilQuiz', hasilId), { nilaiEssay: Number(nilai) });
    setHasilSiswa(prev => prev.map((h, i) => i === index ? { ...h, nilaiEssay: Number(nilai) } : h));
    alert('Nilai essay tersimpan!');
  };


  // ── STYLES ────────────────────────────────────────────────────
  const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(180deg,#e8f0ff 0%,#eef3ff 50%,#f0f4ff 100%)', color: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 90px', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", maxWidth: '430px', margin: '0 auto' },
    input: { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a', fontSize: '15px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', fontFamily: 'inherit' },
    label: { fontSize: '11px', color: '#475569', marginBottom: '6px', display: 'block', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase' },
    select: { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a', fontSize: '15px', marginBottom: '12px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', fontFamily: 'inherit' },
    btnBack: { alignSelf: 'flex-start', background: 'white', border: '1.5px solid #bfdbfe', color: '#2563eb', fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '4px' },
    btnOrange: { width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 14px rgba(249,115,22,0.4)', fontFamily: 'inherit' },
    btnBlue: { flex: 1, padding: '18px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', cursor: 'pointer', fontWeight: '700', fontSize: '16px', color: 'white', boxShadow: '0 4px 14px rgba(59,130,246,0.35)', fontFamily: 'inherit' },
    btnTeal: { width: '100%', padding: '16px 20px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 14px rgba(6,182,212,0.35)', fontFamily: 'inherit' },
    btnGold: { width: '100%', padding: '16px 20px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 14px rgba(245,158,11,0.35)', fontFamily: 'inherit' },
    pwWrap: { position: 'relative', width: '100%' },
    eyeBtn: { position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-65%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '15px' },
    errBox: { background: '#fff1f2', border: '1.5px solid #fda4af', borderRadius: '12px', padding: '12px 16px', color: '#e11d48', fontSize: '13px', marginBottom: '14px', width: '100%', fontWeight: '600' },
    successBox: { background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '12px 16px', color: '#16a34a', fontSize: '13px', marginBottom: '14px', width: '100%', fontWeight: '600' },
    card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', width: '100%', marginBottom: '12px', boxShadow: '0 2px 12px rgba(37,99,235,0.08)' },
    linkBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '12px', color: 'white', fontWeight: '700', fontSize: '14px', textDecoration: 'none' },
  };

  const TopBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', width: '100%' }}>
      <div style={{ width: '58px', height: '58px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.08)', flexShrink: 0 }}>
        <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📚</div>
      </div>
      <div>
        <div style={{ fontSize: '30px', fontWeight: '900', background: 'linear-gradient(135deg,#2563eb,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '2px', lineHeight: 1, fontFamily: 'inherit' }}>E-JULU</div>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>E-Learning</div>
        <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', letterSpacing: '0.5px' }}>SMA NEGERI 1 LUMBANJULU</div>
      </div>
    </div>
  );

  const Footer = () => (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #e2e8f0', padding: '10px 16px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', fontWeight: '600', zIndex: 999, backdropFilter: 'blur(20px)' }}>
      ✦ Development By Restuadi G. Sinaga, S.Kom ✦
    </div>
  );

  // Mount footer sekali sebagai node DOM permanen — tampil di SEMUA halaman otomatis
  // tanpa harus edit kode tiap halaman. Cleanup otomatis kalau komponen unmount.
  useEffect(() => {
    const footer = document.createElement('div');
    footer.setAttribute('data-ejulu-footer', 'true');
    Object.assign(footer.style, {
      position: 'fixed', bottom: '0', left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px', background: 'rgba(255,255,255,0.95)',
      borderTop: '1px solid #e2e8f0', padding: '10px 16px', textAlign: 'center',
      fontSize: '11px', color: '#94a3b8', fontWeight: '600', zIndex: '9999',
      backdropFilter: 'blur(20px)', boxSizing: 'border-box', letterSpacing: '0.3px',
    });
    footer.textContent = '✦ Development By Restuadi G. Sinaga, S.Kom ✦';
    document.body.appendChild(footer);
    return () => { if (document.body.contains(footer)) document.body.removeChild(footer); };
  }, []);

  const BackBtn = ({ to, fn }) => (
    <button style={S.btnBack} onClick={() => { if (fn) fn(); else goBack(); }}>‹ Kembali</button>
  );

  const LoadingSpinner = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', margin: '0 auto 14px', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Memuat...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!authReady) return (
    <div style={{ ...S.page, justifyContent: 'center' }}><TopBar /><LoadingSpinner /></div>
  );


  // ══════════════════════════════════════════════════════════════════
  // SPLASH
  // ══════════════════════════════════════════════════════════════════
  if (page === 'splash') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#e8f0ff 0%,#dce8ff 40%,#eaf0ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', maxWidth: '430px', margin: '0 auto', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(37,99,235,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '4%', right: '6%', width: '60px', height: '60px', border: '1.5px solid rgba(37,99,235,0.2)', borderRadius: '12px', transform: 'rotate(15deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '8%', right: '14%', width: '30px', height: '30px', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '6px', transform: 'rotate(30deg)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '60px 28px 0', boxSizing: 'border-box', flex: 1 }}>
        <div style={{ width: '100px', height: '100px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', boxShadow: '0 8px 32px rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.08)' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>📚</div>
        </div>
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <span style={{ fontSize: '52px', fontWeight: '900', background: 'linear-gradient(135deg,#2563eb,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '2px', lineHeight: 1, display: 'block' }}>E-JULU</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <div style={{ width: '20px', height: '1.5px', background: '#94a3b8' }} />
          <p style={{ fontSize: '13px', color: '#475569', fontWeight: '600', margin: 0 }}>E-learning Sma Negeri 1 Lumbanjulu</p>
          <div style={{ width: '20px', height: '1.5px', background: '#94a3b8' }} />
        </div>
        <button onClick={() => setPage('role')} style={{ padding: '16px 56px', borderRadius: '14px', border: '2px solid rgba(37,99,235,0.4)', background: 'linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,247,255,0.9))', color: '#2563eb', fontSize: '18px', fontWeight: '800', letterSpacing: '4px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          START <span style={{ fontSize: '20px' }}>⚡</span>
        </button>
        <div style={{ width: '100%', maxWidth: '340px', background: 'rgba(255,255,255,0.7)', borderRadius: '20px', padding: '16px', boxShadow: '0 8px 32px rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg,#dbeafe,#ede9fe)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <p style={{ color: '#1e40af', fontWeight: '800', fontSize: '14px', margin: '0 0 2px' }}>Selamat Belajar! 🎓</p>
            <p style={{ color: '#3730a3', fontSize: '11px', margin: 0 }}>Terus semangat, raih masa depanmu!</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[{ icon: '📚', label: 'Materi' }, { icon: '📝', label: 'Quiz' }, { icon: '💬', label: 'Diskusi' }].map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '10px 6px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'flex-start', marginTop: '20px' }}>
          {[{ color: '#3b82f6', label: 'INFORMATIKA' }, { color: '#6366f1', label: 'MATEMATIKA' }, { color: '#8b5cf6', label: 'BAHASA INDONESIA' }, { color: '#06b6d4', label: 'FISIKA' }].map((b, i) => (
            <div key={i} style={{ background: b.color, borderRadius: '6px', padding: '5px 14px', color: 'white', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '2px 2px 8px rgba(0,0,0,0.15)' }}>{b.label}</div>
          ))}
        </div>
      </div>
      <div style={{ width: '100%', padding: '16px', textAlign: 'center', borderTop: '1px solid rgba(37,99,235,0.1)', background: 'rgba(255,255,255,0.6)' }}>
        <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: '600' }}>Development By Restuadi G. Sinaga, S.Kom</p>
      </div>
    </div>
  );

  if (page === 'menunggu') return (
    <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
      <TopBar />
      <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#fef3c7', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '20px' }}>⏳</div>
      <p style={{ color: '#d97706', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Pendaftaran Terkirim!</p>
      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.8', marginBottom: '24px' }}>Akunmu sedang menunggu<br />persetujuan admin sekolah.</p>
      <div style={{ ...S.card, border: '1px solid #93c5fd', textAlign: 'left' }}>
        <p style={{ color: '#2563eb', fontSize: '13px', margin: 0 }}>💡 Hubungi admin sekolah untuk konfirmasi lebih cepat.</p>
      </div>
      <button onClick={() => setPage('role')} style={{ ...S.btnOrange, marginTop: '20px' }}>← Kembali ke Beranda</button>
    </div>
  );

  if (page === 'ditolak') return (
    <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
      <TopBar />
      <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#fef2f2', border: '2px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '20px' }}>❌</div>
      <p style={{ color: '#ef4444', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Pendaftaran Ditolak</p>
      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.8', marginBottom: '24px' }}>Maaf, pendaftaranmu ditolak.<br />Hubungi admin sekolah.</p>
      <button onClick={() => setPage('role')} style={S.btnOrange}>← Kembali ke Beranda</button>
    </div>
  );

  if (page === 'role') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="splash" />
      <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '8px', letterSpacing: '2px', fontWeight: '700' }}>MASUK SEBAGAI</p>
      <p style={{ fontSize: '22px', fontWeight: '800', textAlign: 'center', margin: '0 0 28px', color: '#0f172a' }}>Pilih Peranmu</p>
      <div style={{ display: 'flex', gap: '14px', width: '100%', marginBottom: '14px' }}>
        <button onClick={() => goTo('menuGuru')} style={{ ...S.btnBlue, color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '26px 16px', fontSize: '15px', fontWeight: '700' }}>
          <span style={{ fontSize: '32px' }}>👨‍🏫</span>
          <span>GURU</span>
        </button>
        <button onClick={() => goTo('menuSiswa')} style={{ ...S.btnGold, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '26px 16px', fontSize: '15px', flex: 1 }}>
          <span style={{ fontSize: '32px' }}>🎓</span>
          <span>SISWA</span>
        </button>
      </div>
      <button onClick={() => { setAdminEmail(''); setAdminPassword(''); setAdminError(''); goTo('loginAdmin'); }}
        style={{ width: '100%', padding: '13px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginBottom: '32px' }}>
        🔐 ADMIN
      </button>
      <img src="/robot.png" alt="Robot" style={{ height: '160px', alignSelf: 'flex-start', filter: 'drop-shadow(0 8px 20px rgba(0,150,255,0.3))' }} />
    </div>
  );


  if (page === 'loginAdmin') return (
    <div style={S.page}>
      <TopBar /><BackBtn to="role" />
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
      <p style={{ color: '#d97706', fontSize: '22px', fontWeight: '900', marginBottom: '4px' }}>LOGIN ADMIN</p>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Akses khusus administrator</p>
      {adminError && <div style={S.errBox}>⚠️ {adminError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>Email Admin:</label>
        <input style={S.input} type="email" placeholder="admin@sekolah.sch.id" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
        <label style={S.label}>Password Admin:</label>
        <div style={S.pwWrap}>
          <input style={{ ...S.input, paddingRight: '40px' }} type={showAdminPassword ? 'text' : 'password'} placeholder="••••••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
          <button style={S.eyeBtn} onClick={() => setShowAdminPassword(!showAdminPassword)}>{showAdminPassword ? '🙈' : '👁️'}</button>
        </div>
        <button style={{ ...S.btnOrange, marginTop: '16px' }} onClick={loginAdmin} disabled={loading}>{loading ? '⏳ Memproses...' : '🔐 Masuk sebagai Admin'}</button>
      </div>
    </div>
  );

  if (page === 'adminDashboard') return (
    <div style={S.page}>
      <TopBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
        <p style={{ color: '#d97706', fontSize: '18px', fontWeight: '900', margin: 0 }}>🛡️ PANEL ADMIN</p>
        <button onClick={() => setPage('role')} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>🚪 Keluar</button>
      </div>
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      {adminStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', marginBottom: '14px' }}>
          {[
            { label: 'Siswa', val: adminStats.siswaAktif, icon: '🎓', color: '#3b82f6' },
            { label: 'Guru', val: adminStats.guruAktif, icon: '👨‍🏫', color: '#10b981' },
            { label: 'Pending', val: adminStats.pending, icon: '⏳', color: '#f59e0b' },
            { label: 'Diskusi', val: adminStats.totalDiskusi, icon: '💬', color: '#8b5cf6' },
            { label: 'Quiz', val: adminStats.totalQuiz, icon: '📝', color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '12px 10px', textAlign: 'center', border: `1px solid ${s.color}22`, boxShadow: `0 2px 8px ${s.color}15` }}>
              <div style={{ fontSize: '20px', marginBottom: '2px' }}>{s.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', width: '100%', marginBottom: '8px' }}>
        {[{ key: 'pending', label: '⏳ Pending', warna: '#f59e0b' }, { key: 'all', label: '👥 Semua', warna: '#3b82f6' }, { key: 'poin', label: '🏆 Poin', warna: '#8b5cf6' }].map(t => (
          <button key={t.key} onClick={() => { setAdminTab(t.key); loadAdminUsers(t.key === 'poin' ? 'approved' : t.key); }}
            style={{ padding: '10px 4px', borderRadius: '10px', border: 'none', fontSize: '11px', background: adminTab === t.key ? t.warna : '#f1f5f9', color: adminTab === t.key ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', width: '100%', marginBottom: '8px' }}>
        {[{ key: 'statistik', label: '📊 Statistik', warna: '#06b6d4' }, { key: 'master', label: '🏫 Master', warna: '#10b981' }, { key: 'audit', label: '📋 Log', warna: '#64748b' }].map(t => (
          <button key={t.key} onClick={() => { setAdminTab(t.key); if (t.key === 'statistik') loadAdminStats(); if (t.key === 'audit') loadAuditLog(); if (t.key === 'master') { loadTahunAjaran(); loadKelas(); } }}
            style={{ padding: '10px 4px', borderRadius: '10px', border: 'none', fontSize: '11px', background: adminTab === t.key ? t.warna : '#f1f5f9', color: adminTab === t.key ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
        <button onClick={() => goTo('adminSettings')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>⚙️ Pengaturan</button>
        <button onClick={() => { setAdminTab('mapel'); loadMapelAdmin(); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: adminTab === 'mapel' ? 'none' : '1px solid #e2e8f0', background: adminTab === 'mapel' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'white', color: adminTab === 'mapel' ? 'white' : '#475569', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>📐 Mapel</button>
        <button onClick={() => { setImportPreview([]); setImportMsg(''); goTo('importSiswa'); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>📥 Siswa</button>
        <button onClick={() => { setImportGuruPreview([]); setImportGuruMsg(''); goTo('importGuru'); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#7c3aed', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>👨‍🏫 Guru</button>
      </div>
      <div style={{ width: '100%', marginBottom: '12px' }}>
        <button onClick={() => { loadPengumuman(); goTo('pengumuman'); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>📢 Kelola Pengumuman</button>
      </div>
      {adminLoading && <LoadingSpinner />}

      {adminTab === 'pending' && !adminLoading && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>⏳ Menunggu Persetujuan ({adminUsers.length})</p>
          {adminUsers.length === 0 && <div style={{ ...S.card, textAlign: 'center' }}><p style={{ color: '#94a3b8' }}>Tidak ada pendaftaran baru.</p></div>}
          {adminUsers.map((u, i) => (
            <div key={i} style={{ ...S.card, border: '1px solid #f59e0b' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '15px', color: '#0f172a' }}>{u.nama}</p>
              <p style={{ color: u.role === 'siswa' ? '#d97706' : '#2563eb', fontSize: '12px', margin: '0 0 2px' }}>{u.role === 'siswa' ? `🎓 Siswa — Kelas ${u.kelas}-${u.jurusan}` : `👨‍🏫 Guru — ${u.mapel}`}</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px' }}>{u.email}</p>
              <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 10px' }}>📝 {u.bio}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => approveUserRBAC(u.uid, u.nama)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>✅ Setujui</button>
                <button onClick={() => rejectUserRBAC(u.uid, u.nama)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>❌ Tolak</button>
                <button onClick={() => hapusUserRBAC(u.uid, u.nama)} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', background: '#64748b', color: 'white', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'all' && !adminLoading && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>👥 Semua User ({adminUsers.length})</p>
          {adminUsers.map((u, i) => (
            <div key={i} style={{ ...S.card, border: `1px solid ${u.status === 'approved' ? '#86efac' : u.status === 'pending' ? '#fde68a' : '#fca5a5'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '14px', color: '#0f172a' }}>{u.nama}</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{u.role === 'siswa' ? `🎓 Kelas ${u.kelas}-${u.jurusan}` : `👨‍🏫 ${u.mapel}`}</p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0' }}>{u.email}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: u.status === 'approved' ? '#16a34a' : u.status === 'pending' ? '#d97706' : '#dc2626', color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {u.status === 'approved' ? '✅ Aktif' : u.status === 'pending' ? '⏳' : '❌'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button onClick={() => { setSelectedUser(u); setEditPoinForm({ poinPG: u.poinPG||0, poinEssay: u.poinEssay||0, poinModul: u.poinModul||0, poinUpload: u.poinUpload||0, poinNilai: u.poinNilai||0, pelanggaran: u.pelanggaran||0 }); goTo('adminDetailUser'); }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>👁️ Detail</button>
                <button onClick={() => resetPasswordRBAC(u.email)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🔑 Reset</button>
                <button onClick={() => hapusUserRBAC(u.uid, u.nama)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'poin' && !adminLoading && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>🏆 Edit Poin ({adminUsers.length})</p>
          {adminUsers.map((u, i) => (
            <div key={i} style={{ ...S.card, border: '1px solid #ede9fe', cursor: 'pointer' }}
              onClick={() => { setSelectedUser(u); setEditPoinForm({ poinPG: u.poinPG||0, poinEssay: u.poinEssay||0, poinModul: u.poinModul||0, poinUpload: u.poinUpload||0, poinNilai: u.poinNilai||0, pelanggaran: u.pelanggaran||0 }); goTo('adminDetailUser'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '14px', color: '#0f172a' }}>{u.nama}</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{u.role === 'siswa' ? `🎓 Kelas ${u.kelas}-${u.jurusan}` : `👨‍🏫 ${u.mapel}`}</p>
                </div>
                <p style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>{u.role === 'siswa' ? (u.poinPG||0)+(u.poinEssay||0)+(u.poinModul||0) : (u.poinUpload||0)+(u.poinNilai||0)} pts</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'statistik' && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#06b6d4', fontWeight: '800', fontSize: '15px', marginBottom: '14px' }}>📊 Statistik</p>
          {adminStatsLoading && <LoadingSpinner />}
          {!adminStats && !adminStatsLoading && (
            <div style={{ ...S.card, textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>Klik untuk memuat statistik.</p>
              <button onClick={loadAdminStats} style={{ ...S.btnOrange, marginTop: 0 }}>📊 Muat Statistik</button>
            </div>
          )}
          {adminStats && !adminStatsLoading && (
            <>
              {[
                { label: '🎓 Siswa Aktif', val: adminStats.siswaAktif, color: '#3b82f6' },
                { label: '👨‍🏫 Guru Aktif', val: adminStats.guruAktif, color: '#10b981' },
                { label: '⏳ Pending', val: adminStats.pending, color: '#f59e0b' },
                { label: '💬 Diskusi', val: adminStats.totalDiskusi, color: '#8b5cf6' },
                { label: '📝 Quiz', val: adminStats.totalQuiz, color: '#ef4444' },
                { label: '🏆 Avg Poin', val: adminStats.avgPoin, color: '#06b6d4' },
              ].map((s, i) => (
                <div key={i} style={{ ...S.card, border: `1px solid ${s.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', margin: 0, color: '#0f172a' }}>{s.label}</p>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.val}</div>
                </div>
              ))}
              <button onClick={loadAdminStats} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>🔄 Refresh</button>
            </>
          )}
        </div>
      )}

      {adminTab === 'master' && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#10b981', fontWeight: '800', fontSize: '15px', marginBottom: '14px' }}>🏫 Master Data</p>
          {masterLoading && <LoadingSpinner />}
          <div style={{ ...S.card, border: '1px solid #fde68a', background: '#fffbeb' }}>
            <p style={{ color: '#92400e', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>🔄 Perbaiki Akun Lama, Mapel Guru & Leaderboard</p>
            <p style={{ color: '#92400e', fontSize: '12px', marginBottom: '10px' }}>Sekali klik — (1) pulihkan akses login akun lama, (2) hitung ulang mapel tiap guru dari kartu mapel di atas, (3) siapkan siswa lama biar tetap muncul di Leaderboard. Aman diklik berkali-kali, kapan saja.</p>
            <button onClick={sinkronkanLoginIndex} disabled={migrasiLoading} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              {migrasiLoading ? '⏳ Memproses...' : '🔄 Sinkronkan Sekarang'}
            </button>
          </div>
          <div style={{ ...S.card, border: '1px solid #bbf7d0' }}>
            <p style={{ color: '#16a34a', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>📅 Tahun Ajaran</p>
            {tahunAjaranList.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: t.aktif ? '#f0fdf4' : '#f8fafc', border: `1px solid ${t.aktif ? '#86efac' : '#e2e8f0'}`, marginBottom: '8px' }}>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '13px', margin: '0 0 1px', color: '#0f172a' }}>{t.tahun} · Sem {t.semester}</p>
                  {t.aktif && <span style={{ fontSize: '10px', background: '#16a34a', color: 'white', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>AKTIF</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!t.aktif && <button onClick={() => setAktifTahunAjaran(t.id, t.tahun)} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✓</button>}
                  <button onClick={() => hapusTahunAjaran(t.id, t.tahun)} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
              <input style={{ ...S.input, marginBottom: '8px' }} placeholder="Contoh: 2025/2026" value={tahunAjaranForm.tahun} onChange={e => setTahunAjaranForm(p => ({ ...p, tahun: e.target.value }))} />
              <select style={{ ...S.select, marginBottom: '8px' }} value={tahunAjaranForm.semester} onChange={e => setTahunAjaranForm(p => ({ ...p, semester: e.target.value }))}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
              <button onClick={tambahTahunAjaran} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>✅ Tambah</button>
            </div>
          </div>
          <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
            <p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>🏫 Kelas Aktif</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {kelasList.map((k, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px 10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#4f46e5' }}>{k.tingkat}{k.jurusan}</span>
                  {k.waliKelas && <span style={{ fontSize: '11px', color: '#64748b' }}>· {k.waliKelas}</span>}
                  <button onClick={() => hapusKelas(k.id, `${k.tingkat}${k.jurusan}`)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select style={{ ...S.select, marginBottom: 0, flex: 1 }} value={kelasForm.tingkat} onChange={e => setKelasForm(p => ({ ...p, tingkat: e.target.value }))}>
                {['10','11','12'].map(t => <option key={t} value={t}>Kelas {t}</option>)}
              </select>
              <select style={{ ...S.select, marginBottom: 0, flex: 1 }} value={kelasForm.jurusan} onChange={e => setKelasForm(p => ({ ...p, jurusan: e.target.value }))}>
                {['A','B','C','D','E','F','G','H','I','J'].map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <input style={S.input} placeholder="Wali kelas (opsional)" value={kelasForm.waliKelas} onChange={e => setKelasForm(p => ({ ...p, waliKelas: e.target.value }))} />
            <button onClick={tambahKelas} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#4f46e5,#4338ca)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>✅ Tambah Kelas</button>
          </div>
        </div>
      )}

      {adminTab === 'audit' && (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ color: '#64748b', fontWeight: '800', fontSize: '15px', margin: 0 }}>📋 Audit Trail</p>
            <button onClick={loadAuditLog} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>🔄</button>
          </div>
          {auditLoading && <LoadingSpinner />}
          {auditLog.map((log, i) => {
            const getColor = (aksi) => {
              if (aksi.includes('APPROVE')) return { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' };
              if (aksi.includes('REJECT') || aksi.includes('DELETE') || aksi.includes('HAPUS')) return { bg: '#fff1f2', border: '#fda4af', text: '#e11d48' };
              if (aksi.includes('EDIT') || aksi.includes('SET')) return { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' };
              if (aksi.includes('TAMBAH') || aksi.includes('BUAT')) return { bg: '#f0fdfa', border: '#99f6e4', text: '#0d9488' };
              return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };
            };
            const c = getColor(log.aksi);
            return (
              <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: c.text, background: c.border, padding: '2px 8px', borderRadius: '6px' }}>{log.aksi}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{log.waktu || ''}</span>
                </div>
                {log.detail && <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{log.detail}</p>}
              </div>
            );
          })}
        </div>
      )}

      {adminTab === 'mapel' && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#6366f1', fontWeight: '800', fontSize: '15px', marginBottom: '4px' }}>📐 Kelola Mata Pelajaran</p>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '14px' }}>Edit nama / guru lalu klik Simpan. Hapus mapel yang sudah tidak dipakai.</p>
          {mapelLoading && <LoadingSpinner />}
          <p style={{ color: '#475569', fontWeight: '700', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📋 Mapel yang Sudah Ada ({mapelEditList.length})
          </p>
          {mapelEditList.map((m, idx) => (
            <div key={m.id || idx} style={{ ...S.card, border: '1px solid #ede9fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px' }}>{m.icon || '📚'}</span>
                <input style={{ ...S.input, marginBottom: 0, flex: 1, fontSize: '14px', fontWeight: '700' }} value={m.nama} onChange={e => ubahNamaMapel(idx, e.target.value)} />
              </div>
              <label style={S.label}>Guru Pengampu (boleh dikosongkan)</label>
              <select style={{ ...S.select, marginBottom: 0 }} value={m.guruId || ''} onChange={e => pilihGuruMapel(idx, e.target.value)}>
                <option value="">— Belum ada guru —</option>
                {guruListForMapel.map(g => <option key={g.uid} value={g.uid}>{g.nama} ({g.mapel})</option>)}
              </select>
              {m.guruNama && <p style={{ color: '#6366f1', fontSize: '12px', fontWeight: '600', margin: '6px 0 0' }}>✅ {m.guruNama}</p>}
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: '8px 0 0' }}>⚠️ Klik Simpan setelah ubah nama/guru — perubahan tidak otomatis tersimpan.</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => simpanSatuMapel(idx)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>💾 Simpan</button>
                <button onClick={() => hapusMapelItem(idx)} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', background: '#dc2626', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>🗑️ Hapus</button>
              </div>
            </div>
          ))}
          {mapelEditList.length === 0 && !mapelLoading && (
            <div style={{ ...S.card, textAlign: 'center' }}>
              <button onClick={loadMapelAdmin} style={{ ...S.btnOrange, marginTop: 0 }}>📐 Muat Data Mapel</button>
            </div>
          )}
          {/* Tambah Mapel Baru */}
          <div style={{ ...S.card, border: '2px dashed #6366f1', marginTop: '16px' }}>
            <p style={{ color: '#6366f1', fontWeight: '800', marginBottom: '2px', fontSize: '14px' }}>➕ Tambah Mapel BARU (beda dari yang di atas)</p>
            <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '10px' }}>Ini bikin mapel baru terpisah — tidak akan mengubah/menimpa mapel manapun di atas.</p>
            <AdminTambahMapel mapelEditList={mapelEditList} setMapelEditList={setMapelEditList} guruListForMapel={guruListForMapel} setAdminMsg={setAdminMsg} catatAktivitas={catatAktivitas} S={S} db={db} />
          </div>
        </div>
      )}

    </div>
  );


  // ══════════════════════════════════════════════════════════════════
  // ADMIN DETAIL USER
  // ══════════════════════════════════════════════════════════════════
  if (page === 'adminDetailUser' && selectedUser) return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="adminDashboard" fn={() => { setSelectedUser(null); goTo('adminDashboard'); }} />
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div style={{ fontSize: '36px' }}>{selectedUser.role === 'siswa' ? '🎓' : '👨‍🏫'}</div>
          <div>
            <p style={{ fontWeight: '900', fontSize: '16px', margin: '0 0 2px', color: '#0f172a' }}>{selectedUser.nama}</p>
            <p style={{ color: '#4f46e5', fontSize: '12px', margin: 0 }}>{selectedUser.role === 'siswa' ? `Siswa — Kelas ${selectedUser.kelas}-${selectedUser.jurusan}` : `Guru — ${selectedUser.mapel}`}</p>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0' }}>{selectedUser.email}</p>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.8' }}>
          {selectedUser.role === 'siswa' ? (
            <><p style={{ margin: 0 }}>NISN: {selectedUser.nisn}</p><p style={{ margin: 0 }}>Lahir: {selectedUser.tglLahir}</p><p style={{ margin: 0 }}>Telp: {selectedUser.telpon}</p></>
          ) : (
            <><p style={{ margin: 0 }}>NIP: {selectedUser.nip||'-'}</p><p style={{ margin: 0 }}>Jabatan: {selectedUser.jabatan}</p></>
          )}
        </div>
      </div>
      <div style={{ ...S.card, border: '1px solid #ede9fe' }}>
        <p style={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '12px' }}>🏆 Edit Poin</p>
        {selectedUser.role === 'siswa' ? (
          <>
            <label style={S.label}>Poin PG</label>
            <input style={S.input} type="number" value={editPoinForm.poinPG} onChange={e => setEditPoinForm(p => ({ ...p, poinPG: e.target.value }))} />
            <label style={S.label}>Poin Essay</label>
            <input style={S.input} type="number" value={editPoinForm.poinEssay} onChange={e => setEditPoinForm(p => ({ ...p, poinEssay: e.target.value }))} />
            <label style={S.label}>Poin Modul</label>
            <input style={S.input} type="number" value={editPoinForm.poinModul} onChange={e => setEditPoinForm(p => ({ ...p, poinModul: e.target.value }))} />
          </>
        ) : (
          <>
            <label style={S.label}>Poin Upload</label>
            <input style={S.input} type="number" value={editPoinForm.poinUpload} onChange={e => setEditPoinForm(p => ({ ...p, poinUpload: e.target.value }))} />
            <label style={S.label}>Poin Nilai</label>
            <input style={S.input} type="number" value={editPoinForm.poinNilai} onChange={e => setEditPoinForm(p => ({ ...p, poinNilai: e.target.value }))} />
          </>
        )}
        <label style={S.label}>Pelanggaran</label>
        <input style={S.input} type="number" value={editPoinForm.pelanggaran} onChange={e => setEditPoinForm(p => ({ ...p, pelanggaran: e.target.value }))} />
        <button onClick={() => simpanEditPoinRBAC(selectedUser.uid, selectedUser.nama)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>💾 Simpan Poin</button>
      </div>
      <div style={{ ...S.card, border: '1px solid #ede9fe' }}>
        <p style={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '8px' }}>🔑 Reset Password</p>
        <button onClick={() => resetPasswordRBAC(selectedUser.email)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>📧 Kirim Email Reset</button>
      </div>
      <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
        <p style={{ color: '#4f46e5', fontWeight: 'bold', marginBottom: '8px' }}>📊 Ubah Status</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => approveUserRBAC(selectedUser.uid, selectedUser.nama)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>✅ Setujui</button>
          <button onClick={() => rejectUserRBAC(selectedUser.uid, selectedUser.nama)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🚫 Tolak</button>
        </div>
      </div>
      <div style={{ ...S.card, border: '1px solid #fca5a5' }}>
        <p style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Hapus dari Sistem</p>
        <button onClick={() => hapusUserRBAC(selectedUser.uid, selectedUser.nama)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>🗑️ Hapus User Ini</button>
      </div>
    </div>
  );

  if (page === 'adminSettings') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="adminDashboard" fn={() => { setAdminTab('pending'); loadAdminUsers('pending'); goTo('adminDashboard'); }} />
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>⚙️ Pengaturan Aplikasi</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px' }}>Edit tampilan dan info aplikasi</p>
      <div style={{ ...S.card, border: '1px solid #bbf7d0' }}>
        <p style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '12px' }}>📝 Info Sekolah</p>
        <label style={S.label}>Nama Sekolah</label>
        <input style={S.input} value={appSettings.namaSekolah} onChange={e => setAppSettings(p => ({ ...p, namaSekolah: e.target.value }))} />
        <label style={S.label}>Tagline</label>
        <input style={S.input} value={appSettings.tagline} onChange={e => setAppSettings(p => ({ ...p, tagline: e.target.value }))} />
        <button onClick={simpanAppSettings} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>💾 Simpan</button>
      </div>
      <div style={{ ...S.card, border: '1px solid rgba(255,180,0,0.2)' }}>
        <p style={{ color: '#d97706', fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>🏫 Halaman Tentang</p>
        <button onClick={() => { loadAbout(); goTo('adminEditAbout'); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>✏️ Edit Halaman Tentang</button>
      </div>
      <div style={{ ...S.card, border: '1px solid #fde68a' }}>
        <p style={{ color: '#d97706', fontWeight: 'bold', marginBottom: '8px' }}>🔐 Info Admin</p>
        <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Email: <strong style={{ color: '#0f172a' }}>{userData?.email}</strong></p>
      </div>
    </div>
  );


  if (page === 'menuSiswa') return (
    <div style={S.page}>
      <TopBar /><BackBtn to="role" />
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(217,119,6,0.25)' }}>🎓</div>
      <p style={{ color: '#d97706', fontSize: '20px', fontWeight: '900', textAlign: 'center', margin: '0 0 4px' }}>AKSES SISWA</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '32px' }}>SMA Negeri 1 Lumbanjulu</p>
      <img src="/logo_sekolah.png" alt="Logo" style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '32px', borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }} />
      <button style={S.btnTeal} onClick={() => { setLoginError(''); goTo('loginSiswa'); }}><span style={{ fontSize: '24px' }}>👤</span><span>LOGIN SISWA</span></button>
      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', width: '100%' }}>
        <p style={{ color: '#92400e', fontSize: '12px', margin: 0, textAlign: 'center', fontWeight: '600' }}>🔒 Pendaftaran hanya melalui admin sekolah</p>
      </div>
    </div>
  );

  if (page === 'menuGuru') return (
    <div style={S.page}>
      <TopBar /><BackBtn to="role" />
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}>👨‍🏫</div>
      <p style={{ color: '#2563eb', fontSize: '20px', fontWeight: '900', textAlign: 'center', margin: '0 0 4px' }}>AKSES GURU</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '32px' }}>SMA Negeri 1 Lumbanjulu</p>
      <img src="/logo_sekolah.png" alt="Logo" style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '32px', borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }} />
      <button style={S.btnTeal} onClick={() => { setLoginError(''); goTo('loginGuru'); }}><span style={{ fontSize: '24px' }}>👨‍🏫</span><span>LOGIN GURU</span></button>
      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', width: '100%' }}>
        <p style={{ color: '#92400e', fontSize: '12px', margin: 0, textAlign: 'center', fontWeight: '600' }}>🔒 Pendaftaran hanya melalui admin sekolah</p>
      </div>
    </div>
  );

  if (page === 'loginSiswa') return (
    <div style={S.page}>
      <TopBar /><BackBtn to="menuSiswa" />
      <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', marginBottom: '14px' }}>🎓</div>
      <p style={{ color: '#d97706', fontSize: '22px', fontWeight: '900', marginBottom: '4px' }}>LOGIN SISWA</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginBottom: '28px' }}>Masuk dengan NISN kamu</p>
      {loginError && <div style={S.errBox}>⚠️ {loginError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NISN:</label>
        <input style={S.input} type="text" placeholder="Masukkan NISN" value={siswaLoginNISN} onChange={e => setSiswaLoginNISN(e.target.value)} />
        <label style={S.label}>Password:</label>
        <div style={S.pwWrap}>
          <input style={{ ...S.input, paddingRight: '40px', marginBottom: '0' }} type={showLoginPassword ? 'text' : 'password'} placeholder="••••••••" value={siswaLoginPassword} onChange={e => setSiswaLoginPassword(e.target.value)} autoComplete="current-password" />
          <button type="button" style={S.eyeBtn} onClick={() => setShowLoginPassword(v => !v)}>{showLoginPassword ? '🙈' : '👁️'}</button>
        </div>
        <div style={{ height: '12px' }} />
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ color: '#92400e', fontSize: '12px', margin: 0, fontWeight: '600' }}>⚠️ Akun harus sudah disetujui admin.</p>
        </div>
        <button style={{ ...S.btnGold, borderRadius: '30px', justifyContent: 'center', fontSize: '17px' }} onClick={loginSiswa} disabled={loading}>
          {loading ? '⏳ Memproses...' : '→ Masuk'}
        </button>
      </div>
    </div>
  );

  if (page === 'loginGuru') return (
    <div style={S.page}>
      <TopBar /><BackBtn to="menuGuru" />
      <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', marginBottom: '14px' }}>👨‍🏫</div>
      <p style={{ color: '#2563eb', fontSize: '22px', fontWeight: '900', marginBottom: '4px' }}>LOGIN GURU</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginBottom: '28px' }}>Masuk dengan NIP atau NIK</p>
      {loginError && <div style={S.errBox}>⚠️ {loginError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NIP / NIK:</label>
        <input style={S.input} type="text" placeholder="Masukkan NIP atau NIK" value={guruLoginNIP} onChange={e => setGuruLoginNIP(e.target.value)} />
        <label style={S.label}>Password:</label>
        <div style={S.pwWrap}>
          <input style={{ ...S.input, paddingRight: '40px', marginBottom: '0' }} type={showLoginPassword ? 'text' : 'password'} placeholder="••••••••" value={guruLoginPassword} onChange={e => setGuruLoginPassword(e.target.value)} autoComplete="current-password" />
          <button type="button" style={S.eyeBtn} onClick={() => setShowLoginPassword(v => !v)}>{showLoginPassword ? '🙈' : '👁️'}</button>
        </div>
        <div style={{ height: '12px' }} />
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ color: '#92400e', fontSize: '12px', margin: 0, fontWeight: '600' }}>⚠️ Akun harus sudah disetujui admin.</p>
        </div>
        <button style={{ ...S.btnGold, borderRadius: '30px', justifyContent: 'center', fontSize: '17px' }} onClick={loginGuru} disabled={loading}>
          {loading ? '⏳ Memproses...' : '→ Masuk'}
        </button>
      </div>
    </div>
  );


  if (page === 'dashboard') return (
    <div style={S.page}>
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '430px', height: '180px', background: 'radial-gradient(ellipse at top,rgba(37,99,235,0.1) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <TopBar />
        <div style={{ width: '100%', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '20px', padding: '18px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 28px rgba(37,99,235,0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '2.5px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0, overflow: 'hidden' }}>
              {userData?.fotoUrl
                ? <img src={userData.fotoUrl} alt={userData.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (userData?.avatar || (userRole === 'guru' ? '👨‍🏫' : '🎓'))}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', margin: '0 0 3px', textTransform: 'uppercase' }}>{userRole === 'guru' ? 'Guru' : `Kelas ${userData?.kelas}${userData?.jurusan}`}</p>
              <p style={{ color: 'white', fontSize: '16px', fontWeight: '800', margin: 0 }}>{userData?.nama}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div onClick={() => { setEditBioForm({ bio: userData?.bio||'', citaCita: userData?.citaCita||'', hobby: userData?.hobby||'' }); setSelectedAvatar(userData?.avatar||''); setPengaturanMsg(''); goTo('pengaturan'); }} style={{ textAlign: 'center', cursor: 'pointer', padding: '8px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '18px' }}>⚙️</div>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: '2px' }}>Setelan</div>
            </div>
            <div onClick={() => { loadAbout(); goTo('about'); }} style={{ textAlign: 'center', cursor: 'pointer', padding: '8px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '18px' }}>ℹ️</div>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: '2px' }}>Tentang</div>
            </div>
          </div>
        </div>
        {userRole === 'siswa' && (
          <div style={{ width: '100%', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '1px solid #86efac', borderRadius: '16px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#15803d', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', margin: '0 0 3px', textTransform: 'uppercase' }}>Total Poin Kamu</p>
              <p style={{ color: '#166534', fontSize: '26px', fontWeight: '900', margin: 0 }}>
                {(userData?.poinPG || 0) + (userData?.poinEssay || 0) + (userData?.poinModul || 0)}
                <span style={{ fontSize: '12px', color: '#16a34a', marginLeft: '4px' }}>poin</span>
              </p>
            </div>
            <div style={{ fontSize: '32px' }}>🏆</div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: '14px' }}>
          {[
            { label: 'Forum Belajar', icon: '💬', grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.3)', to: 'forum' },
            { label: 'Daftar Siswa',  icon: '👥', grad: 'linear-gradient(135deg,#3b82f6,#2563eb)', glow: 'rgba(59,130,246,0.3)', to: 'daftarSiswa' },
            { label: 'Daftar Guru',   icon: '👨‍🏫', grad: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.3)', to: 'daftarGuru' },
            { label: 'Pesan',         icon: '✉️', grad: 'linear-gradient(135deg,#06b6d4,#0891b2)', glow: 'rgba(6,182,212,0.3)', to: 'pesan', badge: pesanBadge },
          ].map((m, i) => (
            <button key={i} onClick={() => {
              if (m.to === 'daftarGuru') { loadSemuaGuru(); goTo('daftarGuru'); }
              else if (m.to === 'pesan') { setPesanBadge(0); goTo('pesan'); }
              else if (m.to) goTo(m.to);
            }}
              style={{ padding: '20px 16px 16px', borderRadius: '20px', border: 'none', background: m.grad, color: 'white', fontWeight: '700', fontSize: '15px', cursor: m.to ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', boxShadow: `0 6px 20px ${m.glow}`, opacity: m.to ? 1 : 0.55, textAlign: 'left', minHeight: '110px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '40px', height: '40px', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)', backgroundSize: '8px 8px', borderRadius: '8px' }} />
              {m.badge > 0 && <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '11px', fontWeight: '800', zIndex: 2 }}>{m.badge}</div>}
              <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{m.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{m.label}</span>
                <div style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>›</div>
              </div>
            </button>
          ))}
        </div>
        {/* Pengumuman + Rekap Nilai */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '10px' }}>
          <button onClick={() => { loadPengumuman(); goTo('pengumuman'); }} style={{ flex: 1, padding: '14px 10px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
            📢 Pengumuman
          </button>
          {userRole === 'siswa' && (
            <button onClick={() => { loadRekapNilaiSiswa(); goTo('rekapNilai'); }} style={{ flex: 1, padding: '14px 10px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
              📊 Nilai Saya
            </button>
          )}
        </div>
        {/* #11 Kalender Akademik */}
        <button onClick={() => { loadKalender(); setKalenderTab('semua'); goTo('kalender'); }} style={{ width: '100%', padding: '14px 10px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(124,58,237,0.3)', marginBottom: '14px' }}>
          📅 Kalender Akademik
        </button>
        <button onClick={logout} style={{ width: '100%', padding: '14px', background: 'white', border: '1.5px solid #fecaca', color: '#ef4444', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 8px rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          🚪 Keluar / Logout
        </button>
      </div>
    </div>
  );


  // ══════════════════════════════════════════════════════════════════
  // FORUM PILIH MAPEL
  // ══════════════════════════════════════════════════════════════════
  if (page === 'forum') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>Forum Belajar Online</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px' }}>Pilih Mata Pelajaran</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
        {mapelAktif.map(m => {
          const bisaAkses = userRole === 'siswa' || guruPunyaMapel(m.nama);
          return (
            <button key={m.id} onClick={() => {
              if (!bisaAkses) { alert(`Kamu hanya bisa mengakses ${userData?.mapel}`); return; }
              setSelectedMapel(m);
              if (userRole === 'siswa') { loadBab(m.nama); setSelectedKelas({ tingkat: userData.kelas, jurusan: userData.jurusan }); goTo('forumBab'); }
              else { setGuruPilihTingkat(null); goTo('forumPilihKelas'); }
            }}
              style={{ padding: '16px 10px', borderRadius: '14px', border: 'none', background: bisaAkses ? `linear-gradient(135deg,${m.warna},${m.warna}99)` : '#f1f5f9', color: bisaAkses ? 'white' : '#94a3b8', fontWeight: 'bold', fontSize: '14px', cursor: bisaAkses ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: bisaAkses ? `0 4px 12px ${m.warna}44` : 'none', opacity: bisaAkses ? 1 : 0.5 }}>
              <span style={{ fontSize: '28px' }}>{m.icon}</span>
              <span style={{ textAlign: 'center', lineHeight: '1.3', fontSize: '13px' }}>{m.nama}</span>
              {!bisaAkses && <span style={{ fontSize: '11px' }}>🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (page === 'forumPilihKelas') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forum" />
      <p style={{ color: '#d97706', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>{selectedMapel?.icon} {selectedMapel?.nama}</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px' }}>Pilih Kelas</p>
      {!guruPilihTingkat ? (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>📚 Pilih Tingkat:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['10','11','12'].map(t => (
              <button key={t} onClick={() => setGuruPilihTingkat(t)} style={{ width: '100%', padding: '20px', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg,${selectedMapel?.warna},${selectedMapel?.warna}99)`, color: 'white', fontWeight: '900', fontSize: '22px', cursor: 'pointer', boxShadow: `0 4px 15px ${selectedMapel?.warna}44` }}>Kelas {t}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <button onClick={() => setGuruPilihTingkat(null)} style={{ background: 'white', border: '1px solid #bfdbfe', color: '#4f46e5', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}>← Kelas {guruPilihTingkat}</button>
            <p style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '15px', margin: 0 }}>Pilih Jurusan:</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', width: '100%' }}>
            {['A','B','C','D','E','F','G','H','I','J'].map(j => (
              <button key={j} onClick={() => { setSelectedKelas({ tingkat: guruPilihTingkat, jurusan: j }); loadBab(selectedMapel.nama); goTo('forumBab'); }}
                style={{ padding: '16px 8px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${selectedMapel?.warna},${selectedMapel?.warna}99)`, color: 'white', fontWeight: '900', fontSize: '18px', cursor: 'pointer' }}>
                {guruPilihTingkat}{j}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (page === 'forumBab') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to={userRole === 'guru' ? 'forumPilihKelas' : 'forum'} />
      <p style={{ color: '#d97706', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>{selectedMapel?.icon} {selectedMapel?.nama}</p>
      <p style={{ color: '#4f46e5', fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>📚 Kelas {selectedKelas?.tingkat}{selectedKelas?.jurusan}</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>Pilih Bab Pembelajaran</p>
      <div style={{ width: '100%' }}>
        {babList.length === 0 && <div style={{ ...S.card, textAlign: 'center' }}><p style={{ color: '#94a3b8', fontSize: '14px' }}>{userRole === 'guru' ? 'Belum ada bab.' : 'Belum ada materi.'}</p></div>}
        {babList.map(b => (
          <div key={b.id} style={{ marginBottom: '12px' }}>
            {editBab === b.id
              ? <div style={{ ...S.card, border: '1px solid #f59e0b' }}>
                  <input style={S.input} value={b.judul} onChange={e => setBabList(prev => prev.map(x => x.id === b.id ? { ...x, judul: e.target.value } : x))} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => simpanJudulBab(b.id, b.judul)} style={{ flex: 1, background: '#16a34a', border: 'none', color: 'white', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Simpan</button>
                    <button onClick={() => hapusBab(b.id)} style={{ background: '#dc2626', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              : <button onClick={() => { setSelectedBab(b); setLinkEdit({ modul: b.modul, modul2: b.modul2, video: b.video }); setLinkEditDrive(b.fileDrive || ''); loadSoal(b.id); goTo('forumIsiBab'); }}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#1e3a5f,#1e5799)', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(30,87,153,0.2)' }}>
                  <span>📖 {b.judul}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {userRole === 'guru' && <span onClick={e => { e.stopPropagation(); setEditBab(b.id); }} style={{ fontSize: '16px', cursor: 'pointer' }}>✏️</span>}
                    <span style={{ color: '#93c5fd', fontSize: '20px' }}>›</span>
                  </div>
                </button>
            }
          </div>
        ))}
        {userRole === 'guru' && (
          <div style={{ ...S.card, border: '1px solid #bbf7d0', marginTop: '8px' }}>
            <p style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>+ Tambah Bab Baru</p>
            <input style={S.input} placeholder="Contoh: Bab 4 - Persamaan Linear" value={babBaru} onChange={e => setBabBaru(e.target.value)} />
            <button onClick={tambahBab} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>✅ Tambah Bab</button>
          </div>
        )}
      </div>
    </div>
  );

  if (page === 'forumIsiBab') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumBab" fn={() => { stopTimerModul(); stopTimerVideo(); goTo('forumBab'); }} />
      <p style={{ color: '#d97706', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>{selectedBab?.judul}</p>
      <p style={{ color: '#4f46e5', fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>{selectedMapel?.nama} — Kelas {selectedKelas?.tingkat}{selectedKelas?.jurusan}</p>
      {userRole === 'siswa' && (
        <div style={{ ...S.card, border: '1px solid #bbf7d0', marginBottom: '16px' }}>
          <p style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px', margin: 0 }}>📊 Poin Modul: {hitungPoinModul()}/50 pts | 📖 {modulDurasi} mnt | 🎥 {videoDurasi} mnt</p>
        </div>
      )}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Modul 1 */}
        <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <p style={{ color: '#4f46e5', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>📄 Modul Pembelajaran</p>
          {userRole === 'siswa' ? (selectedBab?.modul ? <a href={selectedBab.modul} target="_blank" rel="noreferrer" onClick={() => { if (!modulTimerRef.current) mulaiTimerModul(); }} style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}><span>📂</span> Buka Modul</a> : <p style={{ color: '#94a3b8', fontSize: '13px' }}>Belum ada modul.</p>)
          : <div><input style={S.input} placeholder="Link modul (Google Drive / PDF)..." value={linkEdit.modul} onChange={e => setLinkEdit(p => ({ ...p, modul: e.target.value }))} /><button onClick={() => simpanLinkBab('modul')} style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>💾 Simpan</button></div>}
        </div>
        {/* Modul 2 */}
        <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <p style={{ color: '#4f46e5', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>📄 Modul Lainnya</p>
          {userRole === 'siswa' ? (selectedBab?.modul2 ? <a href={selectedBab.modul2} target="_blank" rel="noreferrer" onClick={() => { if (!modulTimerRef.current) mulaiTimerModul(); }} style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}><span>📂</span> Buka Modul Lainnya</a> : <p style={{ color: '#94a3b8', fontSize: '13px' }}>Belum ada modul.</p>)
          : <div><input style={S.input} placeholder="Link modul lainnya..." value={linkEdit.modul2} onChange={e => setLinkEdit(p => ({ ...p, modul2: e.target.value }))} /><button onClick={() => simpanLinkBab('modul2')} style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>💾 Simpan</button></div>}
        </div>
        {/* Video */}
        <div style={{ ...S.card, border: '1px solid #fca5a5' }}>
          <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>🎥 Video Pembelajaran</p>
          {userRole === 'siswa' ? (selectedBab?.video ? <a href={selectedBab.video} target="_blank" rel="noreferrer" onClick={() => { if (!videoTimerRef.current) mulaiTimerVideo(); }} style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}><span>▶️</span> Tonton Video</a> : <p style={{ color: '#94a3b8', fontSize: '13px' }}>Belum ada video.</p>)
          : <div><input style={S.input} placeholder="Link YouTube..." value={linkEdit.video} onChange={e => setLinkEdit(p => ({ ...p, video: e.target.value }))} /><button onClick={() => simpanLinkBab('video')} style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>💾 Simpan</button></div>}
        </div>
        {/* #12 File Materi Google Drive */}
        <div style={{ ...S.card, border: '1px solid #bbf7d0' }}>
          <p style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>📁 File Materi (Google Drive)</p>
          {userRole === 'siswa' ? (
            selectedBab?.fileDrive
              ? <a href={selectedBab.fileDrive} target="_blank" rel="noreferrer" style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#16a34a,#15803d)', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                  <span>📂</span> Buka / Download File
                </a>
              : <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Belum ada file materi.</p>
          ) : (
            <div>
              {selectedBab?.fileDrive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '10px 12px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac' }}>
                  <span style={{ fontSize: '18px' }}>📄</span>
                  <p style={{ color: '#15803d', fontSize: '12px', fontWeight: '600', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedBab.fileDrive}</p>
                  <button onClick={hapusFileDrive} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}>✕</button>
                </div>
              )}
              <input style={S.input} placeholder="Link Google Drive (bagikan dulu dengan 'Siapapun yang punya link')..." value={linkEditDrive} onChange={e => setLinkEditDrive(e.target.value)} />
              <button onClick={simpanFileDrive} style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>💾 Simpan Link Drive</button>
            </div>
          )}
        </div>

        {/* Quiz */}
        <div style={{ ...S.card, border: '1px solid #fde68a' }}>
          <p style={{ color: '#d97706', fontWeight: 'bold', marginBottom: '12px', fontSize: '15px' }}>📝 Quiz Pembelajaran</p>
          {userRole === 'siswa' ? (quizSoalList.length > 0 ? (
            quizSudahPernah && quizHasilLama ? (
              <div>
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px' }}>
                  <p style={{ color: '#16a34a', fontWeight: '700', fontSize: '13px', margin: '0 0 4px' }}>✅ Sudah Pernah Dikerjakan</p>
                  <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>Poin PG: {quizHasilLama.poinPG}/20 · Essay: {quizHasilLama.nilaiEssay !== null && quizHasilLama.nilaiEssay !== undefined ? quizHasilLama.nilaiEssay + '/100' : 'Menunggu penilaian'}</p>
                </div>
                <button onClick={() => { setQuizSudahPernah(false); setQuizHasilLama(null); hasilTersimpan.current = false; setQuizSoalAcak(acakSoal(quizSoalList)); setQuizSoalIndex(0); setQuizJawaban({}); setQuizSelesai(false); setTimer(20); goTo('quiz'); }} style={{ ...S.btnOrange, marginTop: 0, background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>🔄 Kerjakan Ulang</button>
              </div>
            ) : (
              <button onClick={async () => { const sdh = await cekSudahQuiz(selectedBab.id); if (!sdh) { hasilTersimpan.current = false; setQuizSoalAcak(acakSoal(quizSoalList)); setQuizSoalIndex(0); setQuizJawaban({}); setQuizSelesai(false); setTimer(20); goTo('quiz'); } }} style={{ ...S.btnOrange, marginTop: 0 }}>🚀 Mulai Quiz</button>
            )
          ) : <p style={{ color: '#94a3b8', fontSize: '13px' }}>Belum ada soal.</p>)
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><button onClick={() => goTo('guruBuatQuiz')} style={{ background: '#8b5cf6', border: 'none', color: 'white', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>✏️ Buat / Edit Soal</button><button onClick={() => { loadHasilSiswa(selectedBab.id, `${selectedKelas?.tingkat}${selectedKelas?.jurusan}`); goTo('guruKelola'); }} style={{ background: '#1e3a8a', border: 'none', color: 'white', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>📊 Lihat Hasil Siswa</button></div>}
        </div>
        {/* Diskusi */}
        <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <p style={{ color: '#4f46e5', fontWeight: '700', marginBottom: '10px', fontSize: '15px' }}>💬 Diskusi Online</p>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>Forum tanya jawab bab ini untuk kelas {selectedKelas?.tingkat}{selectedKelas?.jurusan}</p>
          <button onClick={() => { loadDiskusi(selectedBab.id, `${selectedKelas?.tingkat}${selectedKelas?.jurusan}`); goTo('diskusi'); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#4f46e5,#4338ca)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>💬</span> Buka Forum Diskusi
          </button>
        </div>
      </div>
    </div>
  );


  // Quiz pages (abbreviated)
  if (page === 'quiz') {
    const pgSoal = quizSoalAcak.filter(s => s.tipe === 'pg');
    const essaySoal = quizSoalAcak.filter(s => s.tipe === 'essay');
    if (quizSelesai) {
      const poinPG = hitungPoinPG();
      return (
        <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
          <TopBar />
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
          <p style={{ color: '#16a34a', fontSize: '22px', fontWeight: '900', marginBottom: '16px' }}>Quiz Selesai!</p>
          <div style={{ ...S.card, border: '1px solid #bbf7d0', textAlign: 'left', marginBottom: '16px' }}>
            <p style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: '8px' }}>📊 Hasil:</p>
            <p style={{ color: '#475569', fontSize: '14px', margin: '4px 0' }}>✅ PG: <strong style={{ color: '#0f172a' }}>{poinPG}/20 pts</strong></p>
            <p style={{ color: '#475569', fontSize: '14px', margin: '4px 0' }}>✍️ Essay: <strong style={{ color: '#d97706' }}>Menunggu penilaian guru</strong></p>
            <p style={{ color: '#475569', fontSize: '14px', margin: '4px 0' }}>📖 Modul+Video: <strong style={{ color: '#0f172a' }}>{hitungPoinModul()}/50 pts</strong></p>
          </div>
          <button onClick={() => goTo('forumIsiBab')} style={S.btnOrange}>← Kembali ke Bab</button>
        </div>
      );
    }
    if (quizSoalIndex < pgSoal.length) {
      const soal = pgSoal[quizSoalIndex];
      const persen = (timer / 20) * 100;
      const warnaTimer = timer > 10 ? '#16a34a' : timer > 5 ? '#f59e0b' : '#ef4444';
      return (
        <div style={{ ...S.page, userSelect: 'none', WebkitUserSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
          <TopBar />
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>PG {quizSoalIndex + 1}/{pgSoal.length}</span>
              <span style={{ color: warnaTimer, fontSize: '15px', fontWeight: 'bold' }}>⏱️ {timer}s</span>
            </div>
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
              <div style={{ height: '6px', background: '#f59e0b', borderRadius: '3px', width: `${((quizSoalIndex+1)/pgSoal.length)*100}%`, transition: 'width 0.3s' }} />
            </div>
            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px' }}>
              <div style={{ height: '4px', background: warnaTimer, borderRadius: '3px', width: `${persen}%`, transition: 'width 1s linear' }} />
            </div>
          </div>
          <div style={{ ...S.card, border: '1px solid #bfdbfe', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.6', margin: 0, color: '#0f172a' }}>📌 {soal.soal}</p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {soal.opsi.map((op, i) => (
              <button key={i} onClick={() => setQuizJawaban(prev => ({ ...prev, [soal.id]: op[0] }))}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: quizJawaban[soal.id] === op[0] ? '2px solid #f59e0b' : '1.5px solid #e2e8f0', background: quizJawaban[soal.id] === op[0] ? '#fffbeb' : 'white', color: '#0f172a', fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontWeight: quizJawaban[soal.id] === op[0] ? '700' : '400' }}>
                {op}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
            {quizSoalIndex < pgSoal.length - 1
              ? <button onClick={() => handleNextSoal()} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Selanjutnya →</button>
              : <button onClick={() => { clearInterval(timerRef.current); setQuizSoalIndex(pgSoal.length); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Lanjut ke Essay →</button>
            }
          </div>
        </div>
      );
    }
    const essayIndex = quizSoalIndex - pgSoal.length;
    if (essayIndex < essaySoal.length) {
      const soal = essaySoal[essayIndex];
      return (
        <div style={{ ...S.page, userSelect: 'none', WebkitUserSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
          <TopBar />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Essay {essayIndex+1}/{essaySoal.length}</span>
            <span style={{ color: '#d97706', fontSize: '13px', fontWeight: 'bold' }}>✍️ Tidak ada timer</span>
          </div>
          <div style={{ ...S.card, border: '1px solid #fde68a', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.6', margin: 0, color: '#0f172a' }}>✍️ {soal.soal}</p>
          </div>
          <textarea style={{ ...S.input, height: '150px', resize: 'none' }} placeholder="Tulis jawaban essay kamu..." value={quizJawaban[soal.id] || ''} onChange={e => setQuizJawaban(prev => ({ ...prev, [soal.id]: e.target.value }))} />
          <button onClick={() => { if (essayIndex < essaySoal.length-1) setQuizSoalIndex(i => i+1); else setQuizSelesai(true); }} style={{ ...S.btnOrange, marginTop: '16px' }}>
            {essayIndex < essaySoal.length-1 ? 'Selanjutnya →' : '✅ Selesai & Kirim'}
          </button>
        </div>
      );
    }
    return (
      <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
        <TopBar />
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
        <p style={{ color: '#d97706', fontSize: '20px', fontWeight: '900' }}>Semua soal selesai!</p>
        <button onClick={() => setQuizSelesai(true)} style={{ ...S.btnOrange, marginTop: '16px' }}>Lihat Hasil →</button>
      </div>
    );
  }

  if (page === 'guruBuatQuiz') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumIsiBab" />
      <p style={{ color: '#d97706', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>Buat / Edit Soal Quiz</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px' }}>{selectedMapel?.nama} — {selectedBab?.judul}</p>
      {quizSoalList.length === 0 && <div style={{ ...S.card, textAlign: 'center' }}><p style={{ color: '#94a3b8', fontSize: '14px' }}>Belum ada soal.</p></div>}
      {quizSoalList.map((q, i) => (
        <div key={q.id} style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: '14px' }}>Soal {i+1} — {q.tipe === 'pg' ? 'PG' : 'Essay'}</span>
            <button onClick={() => hapusSoal(q.id)} style={{ background: '#dc2626', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
          </div>
          <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>{q.soal}</p>
          {q.tipe === 'pg' && q.opsi.map((op, j) => (
            <p key={j} style={{ color: op[0] === q.kunci ? '#16a34a' : '#94a3b8', fontSize: '13px', margin: '2px 0' }}>{op[0] === q.kunci ? '✅ ' : ''}{op}</p>
          ))}
        </div>
      ))}
      <div style={{ ...S.card, border: '2px dashed #8b5cf6', marginTop: '8px' }}>
        <p style={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '10px' }}>+ Tambah PG</p>
        <textarea style={{ ...S.input, height: '70px', resize: 'none' }} placeholder="Tulis pertanyaan..." value={soalBaru.soal} onChange={e => setSoalBaru(p => ({ ...p, soal: e.target.value }))} />
        {soalBaru.opsi.map((op, j) => (
          <input key={j} style={{ ...S.input, marginBottom: '6px' }} value={op} onChange={e => setSoalBaru(p => ({ ...p, opsi: p.opsi.map((o, k) => k === j ? e.target.value : o) }))} />
        ))}
        <label style={S.label}>Kunci:</label>
        <select style={S.select} value={soalBaru.kunci} onChange={e => setSoalBaru(p => ({ ...p, kunci: e.target.value }))}>
          {['A','B','C','D','E'].map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={tambahSoalPG} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>✅ Simpan PG</button>
      </div>
      <div style={{ ...S.card, border: '2px dashed #f59e0b', marginTop: '12px' }}>
        <p style={{ color: '#d97706', fontWeight: 'bold', marginBottom: '10px' }}>+ Tambah Essay</p>
        <textarea style={{ ...S.input, height: '80px', resize: 'none' }} placeholder="Tulis soal essay..." value={essayBaru} onChange={e => setEssayBaru(e.target.value)} />
        <button onClick={tambahSoalEssay} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>✅ Simpan Essay</button>
      </div>
    </div>
  );

  if (page === 'guruKelola') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumIsiBab" />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
        <p style={{ color: '#d97706', fontSize: '18px', fontWeight: '900', margin: 0 }}>Hasil Siswa</p>
        {hasilSiswa.length > 0 && (
          <button onClick={exportNilaiGuruExcel} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 Excel
          </button>
        )}
      </div>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>{selectedMapel?.nama} — {selectedBab?.judul} — Kelas {selectedKelas?.tingkat}{selectedKelas?.jurusan}</p>
      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '16px' }}>
        {[{ key: 'pg', label: '📝 PG' }, { key: 'essay', label: '✍️ Essay' }, { key: 'modul', label: '📖 Aktivitas' }].map(t => (
          <button key={t.key} onClick={() => setLihatTab(t.key)} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', fontSize: '12px', background: lihatTab === t.key ? '#2563eb' : '#f1f5f9', color: lihatTab === t.key ? 'white' : '#64748b', fontWeight: lihatTab === t.key ? 'bold' : 'normal', cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>
      {hasilSiswa.length === 0 && <div style={{ ...S.card, textAlign: 'center' }}><p style={{ color: '#94a3b8', fontSize: '14px' }}>Belum ada yang mengerjakan quiz.</p></div>}
      {lihatTab === 'pg' && hasilSiswa.map((s, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '15px', color: '#0f172a' }}>{s.siswaNama}</p><p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Kelas {s.siswaKelas}</p></div>
            <div style={{ textAlign: 'right' }}><p style={{ color: '#16a34a', fontWeight: 'bold', margin: 0 }}>{s.poinPG}/20 pts</p><p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{s.poinPG >= 12 ? '✅ Lulus' : '❌ Remedial'}</p></div>
          </div>
          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '10px' }}>
            <div style={{ height: '6px', background: s.poinPG >= 12 ? '#16a34a' : '#ef4444', borderRadius: '3px', width: `${(s.poinPG/20)*100}%` }} />
          </div>
        </div>
      ))}
      {lihatTab === 'essay' && hasilSiswa.map((s, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid #fde68a' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px', fontSize: '15px', color: '#0f172a' }}>{s.siswaNama}</p>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 10px' }}>Kelas {s.siswaKelas}</p>
          {s.essayJawaban?.map((ej, j) => (
            <div key={j} style={{ marginBottom: '10px' }}>
              <p style={{ color: '#d97706', fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px' }}>{ej.soal}</p>
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
                <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>{ej.jawaban || <span style={{ color: '#94a3b8' }}>Tidak dijawab</span>}</p>
              </div>
            </div>
          ))}
          {s.nilaiEssay !== null && s.nilaiEssay !== undefined
            ? <p style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>✅ Nilai: {s.nilaiEssay}/100</p>
            : <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input style={{ ...S.input, marginBottom: 0, flex: 1 }} type="number" placeholder="Nilai 0-100" value={nilaiEssayInput[i] || ''} onChange={e => setNilaiEssayInput(p => ({ ...p, [i]: e.target.value }))} />
                <button onClick={() => simpanNilaiEssay(s.id, nilaiEssayInput[i], i)} style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontWeight: 'bold' }}>💾</button>
              </div>
          }
        </div>
      ))}
      {lihatTab === 'modul' && hasilSiswa.map((s, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 10px', fontSize: '15px', color: '#0f172a' }}>{s.siswaNama} <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '12px' }}>· {s.siswaKelas}</span></p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ color: '#4f46e5', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{s.modulDurasi} mnt</p>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>Baca Modul</p>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{s.videoDurasi} mnt</p>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>Tonton Video</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );


  // ══════════════════════════════════════════════════════════════════
  // DISKUSI
  // ══════════════════════════════════════════════════════════════════
  if (page === 'diskusi') {
    const kelasLabel = `${selectedKelas?.tingkat}${selectedKelas?.jurusan}`;
    const formatWaktu = (ts) => { if (!ts) return ''; const d = new Date((ts.seconds || ts/1000) * 1000); return d.toLocaleString('id-ID', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); };
    return (
      <div style={{ ...S.page, paddingBottom: '120px' }}>
        <TopBar />
        <BackBtn to="forumIsiBab" />
        <div style={{ width: '100%', background: 'linear-gradient(135deg,#4f46e5,#4338ca)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
          <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: '0 0 2px' }}>💬 Diskusi Online</p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', margin: '0 0 2px' }}>{selectedMapel?.nama} · {selectedBab?.judul}</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0 }}>Kelas {kelasLabel}</p>
        </div>
        <div style={{ ...S.card, padding: '10px 14px', marginBottom: '8px' }}>
          <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>💡 Tahan lama pesan untuk edit/hapus. Tekan 🔄 untuk refresh.</p>
        </div>
        <button onClick={() => loadDiskusi(selectedBab.id, kelasLabel)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #bfdbfe', background: 'white', color: '#4f46e5', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}>🔄 Refresh</button>
        {diskusiLoading && <LoadingSpinner />}
        {!diskusiLoading && diskusiList.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>💬</div>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Belum ada diskusi. Jadilah yang pertama!</p>
          </div>
        )}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {diskusiList.map((d, i) => {
            const isMine = d.pengirimId === userData?.uid;
            const isGuru = d.pengirimRole === 'guru';
            const isActionActive = diskusiActionId === d.id;
            const canAct = isMine || userRole === 'guru';
            return (
              <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isGuru ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{isGuru ? '👨‍🏫' : '🎓'}</div>
                  <span style={{ fontSize: '11px', color: isGuru ? '#2563eb' : '#d97706', fontWeight: '700' }}>{d.pengirimNama}{isGuru ? ' · Guru' : ''}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{formatWaktu(d.timestamp)}</span>
                  {d.diedit && <span style={{ fontSize: '9px', color: '#94a3b8' }}>· diedit</span>}
                </div>
                {diskusiEditId === d.id ? (
                  <div style={{ maxWidth: '85%', width: '100%' }}>
                    <textarea style={{ ...S.input, height: '70px', resize: 'none', marginBottom: '6px' }} value={diskusiEditText} onChange={e => setDiskusiEditText(e.target.value)} autoFocus />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => editDiskusi(d.id, diskusiEditText)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>💾 Simpan</button>
                      <button onClick={() => { setDiskusiEditId(null); setDiskusiActionId(null); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Batal</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: '82%' }}>
                    <div onTouchStart={() => canAct && handleLongPressStart(d)} onTouchEnd={handleLongPressEnd} onMouseDown={() => canAct && handleLongPressStart(d)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}
                      style={{ padding: '10px 14px', borderRadius: isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isMine ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : isGuru ? 'linear-gradient(135deg,#4f46e5,#4338ca)' : 'white', border: (!isMine && !isGuru) ? '1px solid #e2e8f0' : 'none', wordBreak: 'break-word', boxShadow: isMine ? '0 2px 8px rgba(37,99,235,0.25)' : isGuru ? '0 2px 8px rgba(79,70,229,0.2)' : '0 2px 8px rgba(0,0,0,0.06)', cursor: canAct ? 'pointer' : 'default', userSelect: 'none' }}>
                      <p style={{ color: (isMine || isGuru) ? 'white' : '#0f172a', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{d.pesan}</p>
                    </div>
                    {canAct && <p style={{ fontSize: '9px', color: '#94a3b8', margin: '3px 0 0', textAlign: isMine ? 'right' : 'left' }}>Tahan untuk edit{userRole === 'guru' && !isMine ? '/hapus' : ''}</p>}
                  </div>
                )}
                {isActionActive && diskusiEditId !== d.id && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button onClick={() => setDiskusiEditId(d.id)} style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', background: '#2563eb', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✏️ Edit</button>
                    {userRole === 'guru' && <button onClick={() => hapusDiskusi(d.id, d.pengirimId)} style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', background: '#ef4444', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>🗑️ Hapus</button>}
                    <button onClick={() => setDiskusiActionId(null)} style={{ padding: '7px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Input fixed bottom */}
        <div style={{ position: 'fixed', bottom: '44px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: 'rgba(255,255,255,0.97)', borderTop: '1px solid #e2e8f0', padding: '10px 16px', boxSizing: 'border-box', backdropFilter: 'blur(20px)', zIndex: 100 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea style={{ ...S.input, flex: 1, height: '44px', marginBottom: 0, resize: 'none', padding: '10px 14px', fontSize: '14px', lineHeight: '1.4', maxHeight: '100px' }} placeholder="Tulis pertanyaan atau jawaban..." value={diskusiInput} onChange={e => setDiskusiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimDiskusi(selectedBab.id, kelasLabel); } }} />
            <button onClick={() => kirimDiskusi(selectedBab.id, kelasLabel)} disabled={!diskusiInput.trim()} style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: diskusiInput.trim() ? 'linear-gradient(135deg,#4f46e5,#4338ca)' : '#e2e8f0', color: diskusiInput.trim() ? 'white' : '#94a3b8', fontSize: '18px', cursor: diskusiInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
          </div>
        </div>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════════════
  // REGISTRASI SISWA & GURU (ringkas)
  // ══════════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════════
  // PENGATURAN — siswa edit bio/cita-cita/hobby, guru edit bio+telpon
  // ══════════════════════════════════════════════════════════════════
  if (page === 'pengaturan') {
    const avatarSiswaLaki = ['👦','🧑','👱','🧔','👮','🧑‍💻','🧑‍🎓','🧑‍🔬','🧑‍🎨','🦸'];
    const avatarSiswaPerempuan = ['👧','👩','👩‍🦰','👩‍🦱','👩‍🦳','👩‍💻','👩‍🎓','👩‍🔬','👩‍🎨','🦸‍♀️'];
    const avatarGuru = ['👨‍🏫','👩‍🏫','🧑‍🏫','👨‍💼','👩‍💼','🧑‍💼','👨‍🎓','👩‍🎓','🧑‍🎓','👨‍⚕️'];
    const avatarList = userRole === 'guru' ? avatarGuru : [...avatarSiswaLaki, ...avatarSiswaPerempuan];
    const currentAvatar = selectedAvatar || userData?.avatar || (userRole === 'guru' ? '👨‍🏫' : '🎓');

    return (
      <div style={S.page}>
        <TopBar />
        <BackBtn to="dashboard" />
        <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>⚙️ Pengaturan</p>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px', letterSpacing: '1px' }}>KELOLA AKUN KAMU</p>
        {pengaturanMsg && <div style={pengaturanMsg.startsWith('✅') || pengaturanMsg.startsWith('📧') ? S.successBox : S.errBox}>{pengaturanMsg}</div>}

        {/* Avatar */}
        <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>🖼️ Pilih Avatar</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: '3px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 4px 14px rgba(37,99,235,0.2)' }}>
              {currentAvatar}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px' }}>
            {avatarList.map((av, i) => (
              <button key={i} onClick={() => setSelectedAvatar(av)}
                style={{ padding: '10px', borderRadius: '12px', border: selectedAvatar === av ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: selectedAvatar === av ? '#eff6ff' : 'white', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* #9 Foto Profil */}
        <div style={{ ...S.card, border: '1px solid #fbcfe8' }}>
          <p style={{ color: '#db2777', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>📷 Foto Profil</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fbcfe8', flexShrink: 0, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(fotoProfilDataUrl || userData?.fotoUrl)
                ? <img src={fotoProfilDataUrl || userData.fotoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '32px' }}>{userData?.avatar || (userRole === 'guru' ? '👨‍🏫' : '🎓')}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 8px' }}>Upload foto dari galeri HP. Foto dikompres otomatis (maks 300px).</p>
              <label style={{ display: 'block', padding: '10px', borderRadius: '10px', border: '1.5px dashed #f9a8d4', background: '#fdf2f8', color: '#db2777', fontSize: '12px', fontWeight: '700', textAlign: 'center', cursor: 'pointer' }}>
                {uploadFotoProfil ? '⏳ Memproses...' : '📂 Pilih Foto'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadFotoProfil} disabled={uploadFotoProfil} />
              </label>
            </div>
          </div>
          {fotoProfilDataUrl && (
            <button onClick={simpanFotoProfil} style={{ width: '100%', padding: '11px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#ec4899,#db2777)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              💾 Simpan Foto Profil
            </button>
          )}
          {!fotoProfilDataUrl && userData?.fotoUrl && (
            <button onClick={async () => { await updateDoc(doc(db, 'users', userData.uid), { fotoUrl: '' }); setUserData(prev => ({ ...prev, fotoUrl: '' })); setPengaturanMsg('🗑️ Foto dihapus.'); setTimeout(() => setPengaturanMsg(''), 2500); }} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid #fca5a5', background: 'white', color: '#ef4444', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
              🗑️ Hapus Foto Saat Ini
            </button>
          )}
        </div>

        {/* Edit Profil — beda per role */}
        <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
          <p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>✏️ Edit Profil</p>
          {userRole === 'siswa' && (
            <>
              <label style={S.label}>Cita-cita</label>
              <input style={S.input} placeholder="Cita-citamu..." value={editBioForm.citaCita} onChange={e => setEditBioForm(p => ({ ...p, citaCita: e.target.value }))} />
              <label style={S.label}>Hobby</label>
              <input style={S.input} placeholder="Hobi kamu..." value={editBioForm.hobby} onChange={e => setEditBioForm(p => ({ ...p, hobby: e.target.value }))} />
            </>
          )}
          <label style={S.label}>Bio Singkat</label>
          <textarea style={{ ...S.input, height: '80px', resize: 'none' }} placeholder="Ceritakan tentang dirimu..." value={editBioForm.bio} onChange={e => setEditBioForm(p => ({ ...p, bio: e.target.value }))} />
          {userRole === 'guru' && (
            <>
              <label style={S.label}>Nomor Telepon</label>
              <input style={S.input} type="tel" placeholder="08xxxxxxxxxx" value={editBioForm.telpon || userData?.telpon || ''} onChange={e => setEditBioForm(p => ({ ...p, telpon: e.target.value }))} />
              <p style={{ color: '#64748b', fontSize: '11px', margin: '-6px 0 12px' }}>Nomor ini akan tampil di profil guru kamu</p>
            </>
          )}
          <button onClick={simpanEditProfil} style={{ ...S.btnOrange, marginTop: '4px', padding: '13px', fontSize: '14px' }}>
            💾 Simpan Perubahan
          </button>
        </div>

        {/* Info Akun */}
        <div style={{ ...S.card, border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>📋 Info Akun</p>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '2' }}>
            <p style={{ margin: 0 }}>📧 Email: <span style={{ color: '#0f172a', fontWeight: '600' }}>{userData?.email}</span></p>
            {userRole === 'siswa' && <p style={{ margin: 0 }}>🎓 NISN: <span style={{ color: '#0f172a', fontWeight: '600' }}>{userData?.nisn}</span></p>}
            {userRole === 'guru' && userData?.nip && <p style={{ margin: 0 }}>🪪 NIP: <span style={{ color: '#0f172a', fontWeight: '600' }}>{userData?.nip}</span></p>}

          </div>
        </div>

        {/* Ganti Password */}
        <div style={{ ...S.card, border: '1px solid #ede9fe' }}>
          <p style={{ color: '#8b5cf6', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>🔑 Ganti Password</p>
          <label style={S.label}>Password Lama</label>
          <div style={S.pwWrap}>
            <input style={{ ...S.input, paddingRight: '40px' }} type={showLamaPw ? 'text' : 'password'} placeholder="Password saat ini" value={gantiPwForm.lama} onChange={e => setGantiPwForm(p => ({ ...p, lama: e.target.value }))} />
            <button type="button" style={S.eyeBtn} onClick={() => setShowLamaPw(v => !v)}>{showLamaPw ? '🙈' : '👁️'}</button>
          </div>
          <label style={S.label}>Password Baru</label>
          <div style={S.pwWrap}>
            <input style={{ ...S.input, paddingRight: '40px' }} type={showGantiPw ? 'text' : 'password'} placeholder="Min. 6 karakter" value={gantiPwForm.baru} onChange={e => setGantiPwForm(p => ({ ...p, baru: e.target.value }))} />
            <button type="button" style={S.eyeBtn} onClick={() => setShowGantiPw(v => !v)}>{showGantiPw ? '🙈' : '👁️'}</button>
          </div>
          <label style={S.label}>Konfirmasi Password Baru</label>
          <div style={S.pwWrap}>
            <input style={{ ...S.input, paddingRight: '40px' }} type={showKonfirmasiPw ? 'text' : 'password'} placeholder="Ulangi password baru" value={gantiPwForm.konfirmasi} onChange={e => setGantiPwForm(p => ({ ...p, konfirmasi: e.target.value }))} />
            <button type="button" style={S.eyeBtn} onClick={() => setShowKonfirmasiPw(v => !v)}>{showKonfirmasiPw ? '🙈' : '👁️'}</button>
          </div>
          <button onClick={gantiPasswordSendiri} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
            🔑 Simpan Password Baru
          </button>
          <button onClick={gantiPassword} style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#8b5cf6', fontWeight: '600', fontSize: '12px', cursor: 'pointer', marginTop: '6px' }}>
            Lupa password lama? Kirim link reset ke email
          </button>
        </div>

        {/* Logout */}
        <button onClick={logout} style={{ width: '100%', padding: '14px', background: 'white', border: '1.5px solid #fecaca', color: '#ef4444', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 8px rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
          🚪 Keluar / Logout
        </button>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════════════
  // ABOUT
  // ══════════════════════════════════════════════════════════════════
  if (page === 'about') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>ℹ️ Tentang</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px', letterSpacing: '1px' }}>PILIH INFORMASI</p>

      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '18px' }}>
        <button onClick={() => setAboutTab('sekolah')} style={{ flex: 1, padding: '12px 4px', borderRadius: '12px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: aboutTab === 'sekolah' ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f1f5f9', color: aboutTab === 'sekolah' ? 'white' : '#64748b' }}>🏫 Tentang Sekolah</button>
        <button onClick={() => setAboutTab('aplikasi')} style={{ flex: 1, padding: '12px 4px', borderRadius: '12px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: aboutTab === 'aplikasi' ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f1f5f9', color: aboutTab === 'aplikasi' ? 'white' : '#64748b' }}>📱 Tentang Aplikasi</button>
      </div>

      {aboutTab === 'sekolah' && (
        <>
          <div style={{ width: '100%', background: 'linear-gradient(135deg,#1e40af,#1d4ed8)', borderRadius: '20px', padding: '24px 18px', marginBottom: '14px', textAlign: 'center', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
            {aboutData.fotoSekolah ? <img src={aboutData.fotoSekolah} alt="Sekolah" style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '180px', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '120px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '40px' }}>🏫</div>}
            <img src="/logo_sekolah.png" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '50%', marginBottom: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
            <p style={{ color: 'white', fontSize: '17px', fontWeight: '900', margin: '0 0 4px' }}>{aboutData.namaSekolah || 'SMA NEGERI 1 LUMBANJULU'}</p>
            {aboutData.tentang && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: '1.7', margin: '8px 0 0' }}>{aboutData.tentang}</p>}
          </div>
          {(aboutData.visi || aboutData.misi) && (
            <div style={{ ...S.card }}>
              {aboutData.visi && <div style={{ marginBottom: aboutData.misi ? '14px' : 0 }}><p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>🎯 VISI</p><p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{aboutData.visi}</p></div>}
              {aboutData.misi && <div><p style={{ color: '#d97706', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>📌 MISI</p><p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{aboutData.misi}</p></div>}
            </div>
          )}
          <div style={{ ...S.card, textAlign: 'center' }}>
            <p style={{ color: '#d97706', fontWeight: '700', fontSize: '13px', marginBottom: '14px' }}>👤 KEPALA SEKOLAH</p>
            {aboutData.fotoKepsek ? <img src={aboutData.fotoKepsek} alt="Kepsek" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px', border: '2px solid #fde68a' }} /> : <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 10px' }}>👤</div>}
            <p style={{ color: '#0f172a', fontWeight: '800', fontSize: '15px', margin: '0 0 4px' }}>{aboutData.namaKepsek || 'Belum diisi admin'}</p>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{aboutData.jabatanKepsek || 'Kepala Sekolah'}</p>
          </div>
        </>
      )}

      {aboutTab === 'aplikasi' && (
        <>
          <div style={{ width: '100%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: '20px', padding: '28px 18px', marginBottom: '14px', textAlign: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 14px' }}>📚</div>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: '900', letterSpacing: '2px', margin: '0 0 4px' }}>E-JULU</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>E-Learning SMA Negeri 1 Lumbanjulu</p>
          </div>
          <div style={{ ...S.card }}>
            <p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>📖 TENTANG APLIKASI</p>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.8', margin: 0 }}>
              {aboutData.deskripsiApp || 'E-JULU adalah aplikasi e-learning yang menghubungkan siswa dan guru dalam satu tempat — mulai dari belajar lewat Forum Belajar, mengerjakan quiz, berdiskusi, sampai chat langsung antara guru dan siswa.'}
            </p>
          </div>
          <div style={{ ...S.card }}>
            <p style={{ color: '#d97706', fontWeight: '700', fontSize: '13px', marginBottom: '12px' }}>✨ FITUR UTAMA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[{ icon: '💬', label: 'Forum Belajar — materi, quiz & diskusi per mapel' }, { icon: '👥', label: 'Daftar Siswa & Guru — profil dan papan prestasi' }, { icon: '✉️', label: 'Pesan — chat langsung guru ↔ siswa' }].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{f.icon}</span>
                  <span style={{ fontSize: '12.5px', color: '#475569' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px', padding: '16px' }}>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 2px', letterSpacing: '1px' }}>DIKEMBANGKAN OLEH</p>
            <p style={{ color: '#4f46e5', fontSize: '13px', fontWeight: '700', margin: 0 }}>Restuadi G. Sinaga, S.Kom</p>
          </div>
        </>
      )}
    </div>
  );

  if (page === 'adminEditAbout') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="adminSettings" fn={() => goTo('adminSettings')} />
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>✏️ Edit Halaman Tentang</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '20px' }}>Perubahan langsung tampil ke semua orang setelah disimpan</p>

      <div style={{ ...S.card, border: '1px solid #c7d2fe' }}>
        <p style={{ color: '#4f46e5', fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>📱 Tentang Aplikasi</p>
        <label style={S.label}>Deskripsi Aplikasi</label>
        <textarea style={{ ...S.input, height: '90px', resize: 'none' }} placeholder="Ceritakan singkat tentang aplikasi E-JULU..." value={aboutData.deskripsiApp} onChange={e => setAboutData(p => ({ ...p, deskripsiApp: e.target.value }))} />
        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '-6px 0 0' }}>Kosongkan untuk pakai deskripsi bawaan.</p>
      </div>

      <div style={{ ...S.card, border: '1px solid #bfdbfe' }}>
        <p style={{ color: '#4f46e5', fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>🏫 Info Sekolah</p>
        <label style={S.label}>Nama Sekolah</label><input style={S.input} value={aboutData.namaSekolah} onChange={e => setAboutData(p => ({ ...p, namaSekolah: e.target.value }))} />

        <label style={S.label}>Foto Sekolah</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {aboutData.fotoSekolah ? <img src={aboutData.fotoSekolah} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏫</div>}
          <label style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px dashed #93c5fd', background: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: '700', textAlign: 'center', cursor: 'pointer' }}>
            {uploadingFoto === 'fotoSekolah' ? '⏳ Memproses...' : '📤 Upload Foto'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFotoAbout('fotoSekolah')} />
          </label>
        </div>

        <label style={S.label}>Tentang Sekolah</label><textarea style={{ ...S.input, height: '80px', resize: 'none' }} value={aboutData.tentang} onChange={e => setAboutData(p => ({ ...p, tentang: e.target.value }))} />
        <label style={S.label}>Visi</label><textarea style={{ ...S.input, height: '70px', resize: 'none' }} value={aboutData.visi} onChange={e => setAboutData(p => ({ ...p, visi: e.target.value }))} />
        <label style={S.label}>Misi</label><textarea style={{ ...S.input, height: '70px', resize: 'none' }} value={aboutData.misi} onChange={e => setAboutData(p => ({ ...p, misi: e.target.value }))} />
      </div>

      <div style={{ ...S.card, border: '1px solid #fde68a' }}>
        <p style={{ color: '#d97706', fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>👤 Kepala Sekolah</p>
        <label style={S.label}>Nama Kepala Sekolah</label><input style={S.input} placeholder="Nama lengkap..." value={aboutData.namaKepsek} onChange={e => setAboutData(p => ({ ...p, namaKepsek: e.target.value }))} />
        <label style={S.label}>Jabatan</label><input style={S.input} placeholder="Kepala Sekolah" value={aboutData.jabatanKepsek} onChange={e => setAboutData(p => ({ ...p, jabatanKepsek: e.target.value }))} />

        <label style={S.label}>Foto Kepala Sekolah</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {aboutData.fotoKepsek ? <img src={aboutData.fotoKepsek} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #fde68a' }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>}
          <label style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px dashed #fbbf24', background: '#fffbeb', color: '#b45309', fontSize: '12px', fontWeight: '700', textAlign: 'center', cursor: 'pointer' }}>
            {uploadingFoto === 'fotoKepsek' ? '⏳ Memproses...' : '📤 Upload Foto'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFotoAbout('fotoKepsek')} />
          </label>
        </div>
      </div>

      <button onClick={simpanAbout} style={{ ...S.btnOrange, fontSize: '15px', padding: '14px' }}>💾 Simpan & Perbarui Halaman Tentang</button>
    </div>
  );


  // ══════════════════════════════════════════════════════════════════
  // DAFTAR SISWA
  // ══════════════════════════════════════════════════════════════════
  if (page === 'daftarSiswa') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>👥 Daftar Siswa</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '24px' }}>PILIH KELAS ATAU LIHAT PRESTASI</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {[{ tingkat: '10', color: '#2563eb', grad: 'linear-gradient(135deg,#3b82f6,#2563eb)' }, { tingkat: '11', color: '#0ea5e9', grad: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }, { tingkat: '12', color: '#06b6d4', grad: 'linear-gradient(135deg,#06b6d4,#0891b2)' }].map(k => (
          <button key={k.tingkat} onClick={() => { setDaftarSiswaTingkat(k.tingkat); setDaftarSiswaJurusan(null); goTo('daftarSiswaKelas'); }}
            style={{ width: '100%', padding: '20px 22px', borderRadius: '18px', border: 'none', background: k.grad, color: 'white', fontWeight: '800', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 6px 20px ${k.color}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>🎓</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '18px', fontWeight: '900' }}>Kelas {k.tingkat}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Pilih jurusan A–J</div>
              </div>
            </div>
            <span style={{ fontSize: '22px' }}>›</span>
          </button>
        ))}
        <button onClick={() => { loadLeaderboard(); goTo('leaderboard'); }}
          style={{ width: '100%', padding: '20px 22px', borderRadius: '18px', border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontWeight: '800', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 6px 20px rgba(245,158,11,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>🏆</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>Prestasi</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Top 50 siswa terbaik</div>
            </div>
          </div>
          <span style={{ fontSize: '22px' }}>›</span>
        </button>
      </div>
    </div>
  );

  if (page === 'daftarSiswaKelas') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="daftarSiswa" />
      <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>🎓 Kelas {daftarSiswaTingkat}</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px' }}>PILIH JURUSAN</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', width: '100%' }}>
        {['A','B','C','D','E','F','G','H','I','J'].map(j => (
          <button key={j} onClick={() => { setDaftarSiswaJurusan(j); loadSiswaByKelas(daftarSiswaTingkat, j); goTo('daftarSiswaList'); }}
            style={{ padding: '18px 8px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', fontWeight: '900', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37,99,235,0.2)' }}>
            {daftarSiswaTingkat}{j}
          </button>
        ))}
      </div>
    </div>
  );

  if (page === 'daftarSiswaList') {
    const downloadDaftarSiswaExcel = async () => {
      await loadExcelJS();
      const ExcelJS = window.ExcelJS;
      const wb = new ExcelJS.Workbook(); wb.creator = 'E-JULU';
      const ws = wb.addWorksheet(`Kelas ${daftarSiswaTingkat}${daftarSiswaJurusan}`, { views: [{ state: 'frozen', ySplit: 2 }] });
      // Baris judul
      ws.mergeCells('A1:J1');
      const title = ws.getCell('A1');
      title.value = `DAFTAR SISWA KELAS ${daftarSiswaTingkat}${daftarSiswaJurusan} — SMA NEGERI 1 LUMBANJULU`;
      title.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
      title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      title.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 30;
      ws.columns = [
        { key:'no',     width: 5  }, { key:'nisn',   width: 14 },
      { key:'nama',   width: 28 }, { key:'jk',     width: 12 }, { key:'agama',  width: 12 },
        { key:'kwn',    width: 8  }, { key:'kelas',  width: 8  }, { key:'jurusan',width: 9  },
        { key:'tgl',    width: 13 }, { key:'telpon', width: 16 },
      ];
      const hRow = ws.addRow(['No','NISN','Nama Lengkap','Jenis Kelamin','Agama','WN','Kelas','Jurusan','Tgl Lahir','No. Telepon']);
      hRow.height = 22;
      hRow.eachCell(cell => {
        cell.font = { bold:true, color:{argb:'FFFFFFFF'}, size:10, name:'Calibri' };
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1D4ED8'} };
        cell.alignment = { horizontal:'center', vertical:'middle' };
        cell.border = { top:{style:'thin',color:{argb:'FF93C5FD'}}, left:{style:'thin',color:{argb:'FF93C5FD'}}, bottom:{style:'medium',color:{argb:'FFBFDBFE'}}, right:{style:'thin',color:{argb:'FF93C5FD'}} };
      });
      const border = { top:{style:'thin',color:{argb:'FFBFDBFE'}}, left:{style:'thin',color:{argb:'FFBFDBFE'}}, bottom:{style:'thin',color:{argb:'FFBFDBFE'}}, right:{style:'thin',color:{argb:'FFBFDBFE'}} };
      let laki = 0, perempuan = 0;
      daftarSiswaList.forEach((s, idx) => {
        if (s.jenisKelamin === 'Laki-laki') laki++;
        else if (s.jenisKelamin === 'Perempuan') perempuan++;
        const row = ws.addRow([idx+1, s.nisn||'-', s.nama||'-', s.jenisKelamin||'-', s.agama||'-', s.kewarganegaraan||'WNI', s.kelas||'-', s.jurusan||'-', s.tglLahir||'-', s.telpon||'-']);
        row.height = 19;
        const bg = idx%2===0 ? 'FFEFF6FF' : 'FFFFFFFF';
        row.eachCell({includeEmpty:true}, (cell, c) => {
          cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:bg} };
          cell.font = { size:10, name:'Calibri' };
          cell.alignment = { horizontal: c===4 ? 'left' : 'center', vertical:'middle' };
          cell.border = border;
        });
      });
      // Baris ringkasan L/P
      ws.addRow([]);
      const totalRow = ws.addRow([`Total Siswa: ${daftarSiswaList.length}`, '', '', '', `Laki-laki: ${laki}`, `Perempuan: ${perempuan}`, '', '', '', '', '']);
      [1,5,6].forEach(c => {
        const cell = totalRow.getCell(c);
        cell.font = { bold:true, size:10, color:{argb:'FF1E3A8A'} };
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFDBEAFE'} };
        cell.border = border;
      });
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href=url; a.download=`Daftar_Siswa_Kelas${daftarSiswaTingkat}${daftarSiswaJurusan}_EJULU.xlsx`; a.click();
      URL.revokeObjectURL(url);
    };
    return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="daftarSiswaKelas" />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%', marginBottom:'2px' }}>
        <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', margin: 0 }}>👥 Kelas {daftarSiswaTingkat}{daftarSiswaJurusan}</p>
        {!daftarLoading && daftarSiswaList.length > 0 && (
          <button onClick={downloadDaftarSiswaExcel} style={{ padding:'8px 14px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', fontWeight:'700', fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            📥 Excel
          </button>
        )}
      </div>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '10px' }}>{daftarLoading ? 'Memuat...' : `${daftarSiswaList.length} siswa · urut poin tertinggi`}</p>
      <input style={{ ...S.input, marginBottom: '12px' }} placeholder="🔍 Cari nama atau NISN..." value={searchSiswa} onChange={e => setSearchSiswa(e.target.value)} />
      {daftarLoading && <LoadingSpinner />}
      {!daftarLoading && daftarSiswaList.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎓</div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Kelas {daftarSiswaTingkat}{daftarSiswaJurusan} belum memiliki siswa.</p>
        </div>
      )}
      {!daftarLoading && daftarSiswaList.length > 0 && (() => {
        const filtered = searchSiswa.trim() ? daftarSiswaList.filter(s => s.nama?.toLowerCase().includes(searchSiswa.toLowerCase()) || s.nisn?.includes(searchSiswa)) : daftarSiswaList;
        return (
        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #bfdbfe', boxShadow: '0 4px 16px rgba(37,99,235,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 28px 1fr 1fr 64px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', padding: '10px 12px', gap: '8px', alignItems: 'center' }}>
            {['NO','','NAMA','NISN','POIN'].map((h, i) => <div key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: '700', textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>)}
          </div>
          {filtered.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Tidak ada hasil untuk "{searchSiswa}"</div>}
          {filtered.map((s, i) => (
            <div key={i} onClick={() => { setSelectedProfile({ ...s, type: 'siswa', rank: null }); goTo('profilSiswa'); }}
              style={{ display: 'grid', gridTemplateColumns: '36px 28px 1fr 1fr 64px', padding: '10px 12px', gap: '8px', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#f8faff', borderTop: '1px solid #e2e8f0', cursor: 'pointer' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#4f46e5', textAlign: 'center' }}>{i+1}</div>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', overflow: 'hidden' }}>{s.fotoUrl ? <img src={s.fotoUrl} alt={s.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (s.avatar || '🎓')}</div>
              <p style={{ fontWeight: '700', fontSize: '13px', margin: 0, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nama}</p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{s.nisn}</p>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#4f46e5', textAlign: 'right', display: 'block' }}>{hitungTotalPoin(s)}</span>
            </div>
          ))}
        </div>
        );
      })()}
    </div>
    );
  }

  if (page === 'leaderboard') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="daftarSiswa" />
      <p style={{ color: '#d97706', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>🏆 Papan Prestasi</p>
      <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px', letterSpacing: '0.8px' }}>TOP 50 SISWA TERBAIK SE-SEKOLAH</p>
      {daftarLoading && <LoadingSpinner />}
      {!daftarLoading && leaderboard.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}><p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Belum ada data prestasi.</p></div>}
      {leaderboard.map((s, i) => {
        const rank = i+1;
        const badge = getRankBadge(rank);
        const totalPoin = hitungTotalPoin(s);
        return (
          <div key={i} onClick={() => { setSelectedProfile({ ...s, type: 'siswa', rank }); goTo('profilSiswa'); }}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '16px', marginBottom: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: rank <= 3 ? 'white' : '#f8faff', border: `1px solid ${rank <= 3 ? badge.color+'44' : '#e2e8f0'}`, boxShadow: rank <= 3 ? `0 4px 16px ${badge.color}22` : '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: rank <= 3 ? `${badge.color}22` : '#f1f5f9', border: `2px solid ${badge.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: rank <= 3 ? '22px' : '14px', fontWeight: '900', color: badge.color }}>{rank <= 3 ? badge.icon : `#${rank}`}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: '800', fontSize: '14px', margin: '0 0 2px', color: rank <= 3 ? badge.color : '#0f172a' }}>{s.nama}</p>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>Kelas {s.kelas}{s.jurusan}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ color: rank <= 3 ? badge.color : '#d97706', fontWeight: '900', fontSize: '18px', margin: 0 }}>{totalPoin}</p>
              <p style={{ color: '#94a3b8', fontSize: '10px', margin: 0 }}>poin</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (page === 'profilSiswa' && selectedProfile) {
    const totalPoin = hitungTotalPoin(selectedProfile);
    const rank = selectedProfile.rank;
    const isTop50 = rank !== null && rank <= 50;
    const badge = rank ? getRankBadge(rank) : null;
    return (
      <div style={S.page}>
        <TopBar />
        <BackBtn to={rank !== null ? 'leaderboard' : 'daftarSiswaList'} fn={() => { setSelectedProfile(null); setPage(rank !== null ? 'leaderboard' : 'daftarSiswaList'); }} />
        <div style={{ width: '100%', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: '20px', padding: '24px 18px', marginBottom: '14px', textAlign: 'center', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', margin: '0 auto 14px', overflow: 'hidden' }}>
            {selectedProfile.fotoUrl ? <img src={selectedProfile.fotoUrl} alt={selectedProfile.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedProfile.avatar || '🎓')}
          </div>
          <p style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: '0 0 4px' }}>{selectedProfile.nama}</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: '0 0 2px' }}>Kelas {selectedProfile.kelas}{selectedProfile.jurusan}</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '0 0 16px' }}>NISN: {selectedProfile.nisn}</p>
          <div style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '12px' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', margin: '0 0 4px', textTransform: 'uppercase' }}>Total Poin</p>
            <p style={{ color: 'white', fontSize: '32px', fontWeight: '900', margin: 0 }}>{totalPoin}<span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }}>pts</span></p>
          </div>
        </div>
        <div style={{ ...S.card }}>
          <p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '13px', marginBottom: '12px', letterSpacing: '1px' }}>📋 TENTANG</p>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '2' }}>
            {selectedProfile.citaCita && <p style={{ margin: '0 0 4px' }}>🎯 Cita-cita: <span style={{ color: '#0f172a', fontWeight: '600' }}>{selectedProfile.citaCita}</span></p>}
            {selectedProfile.hobby && <p style={{ margin: '0 0 4px' }}>🎮 Hobby: <span style={{ color: '#0f172a', fontWeight: '600' }}>{selectedProfile.hobby}</span></p>}
            {selectedProfile.bio && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}><p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{selectedProfile.bio}</p></div>}
            {!selectedProfile.citaCita && !selectedProfile.hobby && !selectedProfile.bio && <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Belum ada info profil.</p>}
          </div>
        </div>
        {isTop50 && (
          <div style={{ width: '100%', background: 'linear-gradient(160deg,#fdfaf2,#f6ecd2 50%,#fdfaf2)', border: '1px solid #d4af37', borderRadius: '18px', marginBottom: '14px', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 32px rgba(184,134,11,0.22)' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Tangerine:wght@700&display=swap');`}</style>

            {/* Garis dekoratif pojok kiri-atas & kanan-bawah */}
            <svg viewBox="0 0 130 130" style={{ position: 'absolute', top: 0, left: 0, width: '110px', height: '110px', opacity: 0.55, pointerEvents: 'none' }}>
              <path d="M-5,38 C28,38 28,5 60,5 C92,5 92,38 125,38" stroke="#c9a227" strokeWidth="1.6" fill="none" />
              <path d="M-5,55 C22,55 22,22 48,22 C74,22 74,55 98,55" stroke="#c9a227" strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
            <svg viewBox="0 0 130 130" style={{ position: 'absolute', bottom: 0, right: 0, width: '110px', height: '110px', opacity: 0.55, transform: 'rotate(180deg)', pointerEvents: 'none' }}>
              <path d="M-5,38 C28,38 28,5 60,5 C92,5 92,38 125,38" stroke="#c9a227" strokeWidth="1.6" fill="none" />
              <path d="M-5,55 C22,55 22,22 48,22 C74,22 74,55 98,55" stroke="#c9a227" strokeWidth="1" fill="none" opacity="0.6" />
            </svg>

            {/* Meterai emas pojok kanan-bawah */}
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '64px', height: '64px', borderRadius: '50%', background: 'repeating-conic-gradient(from 0deg, #d4af37 0deg 9deg, #b8943f 9deg 18deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.18)' }}>
              <div style={{ width: '47px', height: '47px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fdf3d0, #c9a227 60%, #8a6d1f)', border: '1px solid #fff6d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', fontWeight: 800, color: '#fffbe8', letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.15 }}>E-JULU<br />★</span>
              </div>
            </div>

            <div style={{ position: 'relative', padding: '32px 22px 30px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '9px', letterSpacing: '4px', color: '#a9822f', fontWeight: 700, margin: '0 0 8px' }}>SMA NEGERI 1 LUMBANJULU</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 800, color: '#8a6d1f', letterSpacing: '3px', margin: '0 0 2px' }}>SERTIFIKAT</h2>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '6px', color: '#b8943f', margin: '0 0 18px', fontWeight: 600 }}>PRESTASI AKADEMIK</p>

              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff6d8, #e6c25c 55%, #a9822f)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 3px 10px rgba(169,130,47,0.4), inset 0 1px 2px rgba(255,255,255,0.6)' }}>{badge.icon}</div>

              <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#8a7140', margin: '0 0 8px', fontWeight: 600 }}>DENGAN BANGGA DIBERIKAN KEPADA</p>
              <p style={{ fontFamily: "'Tangerine', cursive", fontWeight: 700, fontSize: '42px', color: '#7a5c14', margin: '0 0 2px', lineHeight: 1, wordBreak: 'break-word' }}>{selectedProfile.nama}</p>
              <div style={{ width: '150px', height: '1px', background: 'linear-gradient(90deg,transparent,#c9a227,transparent)', margin: '8px auto 16px' }} />

              <p style={{ fontSize: '12.5px', color: '#4a3f2a', lineHeight: '1.8', margin: '0 auto 16px', maxWidth: '300px' }}>
                Siswa-siswi <strong>Kelas {selectedProfile.kelas}{selectedProfile.jurusan}</strong> ini telah membuktikan dedikasi dan konsistensi belajarnya dengan menduduki <strong>{badge.label}</strong> di Papan Prestasi E-JULU, mengumpulkan <strong>{totalPoin} poin akademik</strong> melalui pembelajaran, penilaian, dan keaktifan di kelas.
              </p>

              <p style={{ fontSize: '11px', color: '#8a7140', letterSpacing: '0.5px', margin: 0 }}>
                Lumbanjulu, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════════════
  // DAFTAR GURU & PROFIL GURU
  // ══════════════════════════════════════════════════════════════════
  if (page === 'daftarGuru') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>👨‍🏫 Daftar Guru</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '10px' }}>{daftarLoading ? 'Memuat...' : `${daftarGuruList.length} guru aktif`}</p>
      <input style={{ ...S.input, marginBottom: '12px' }} placeholder="🔍 Cari nama atau mata pelajaran..." value={searchGuru} onChange={e => setSearchGuru(e.target.value)} />
      {daftarLoading && <LoadingSpinner />}
      {!daftarLoading && daftarGuruList.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}><p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Belum ada guru terdaftar.</p></div>}
      {(searchGuru.trim() ? daftarGuruList.filter(g => g.nama?.toLowerCase().includes(searchGuru.toLowerCase()) || g.mapel?.toLowerCase().includes(searchGuru.toLowerCase()) || g.namaPanggilan?.toLowerCase().includes(searchGuru.toLowerCase())) : daftarGuruList).map((g, i) => (
        <div key={i} onClick={() => { setSelectedProfile({ ...g, type: 'guru' }); goTo('profilGuru'); }}
          style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: g.fotoUrl ? 'none' : 'linear-gradient(135deg,#dc2626,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, boxShadow: '0 4px 12px rgba(220,38,38,0.2)', overflow: 'hidden' }}>
            {g.fotoUrl ? <img src={g.fotoUrl} alt={g.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (g.avatar || '👨‍🏫')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: '800', fontSize: '14px', margin: '0 0 2px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.namaPanggilan || g.nama}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '3px 0' }}>
              {(g.mapelList?.length > 0 ? g.mapelList : g.mapel ? [g.mapel] : ['-']).map((m, i) => (
                <span key={i} style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: '6px', padding: '1px 7px', fontSize: '10px', fontWeight: '700' }}>{m}</span>
              ))}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{g.jabatan || 'Guru'}{g.bio ? ` · ${g.bio.slice(0,40)}${g.bio.length>40?'...':''}` : ''}</p>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '18px' }}>›</span>
        </div>
      ))}
    </div>
  );

  if (page === 'profilGuru' && selectedProfile) return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="daftarGuru" fn={() => { setSelectedProfile(null); goTo('daftarGuru'); }} />

      {/* Header kartu merah */}
      <div style={{ width: '100%', background: 'linear-gradient(135deg,#dc2626,#991b1b)', borderRadius: '24px', padding: '28px 20px 20px', marginBottom: '14px', textAlign: 'center', boxShadow: '0 8px 28px rgba(220,38,38,0.35)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {selectedProfile.fotoUrl ? <img src={selectedProfile.fotoUrl} alt={selectedProfile.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedProfile.avatar || '👨‍🏫')}
        </div>
        <p style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: '0 0 3px', letterSpacing: '0.3px' }}>{selectedProfile.nama}</p>
        {selectedProfile.namaPanggilan && selectedProfile.namaPanggilan !== selectedProfile.nama && (
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '0 0 8px', fontStyle: 'italic' }}>"{selectedProfile.namaPanggilan}"</p>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
          {(selectedProfile.mapelList?.length > 0 ? selectedProfile.mapelList : selectedProfile.mapel ? [selectedProfile.mapel] : []).map((m, i) => (
            <span key={i} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '700', color: 'white' }}>{m}</span>
          ))}
        </div>
        {selectedProfile.jabatan && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: '8px 0 0', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>{selectedProfile.jabatan}</p>}
      </div>

      {/* Bio */}
      {selectedProfile.bio && (
        <div style={{ ...S.card, border: '1px solid #fecaca' }}>
          <p style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>💬 Bio</p>
          <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.75', margin: 0 }}>{selectedProfile.bio}</p>
        </div>
      )}

      {/* Info detail */}
      <div style={{ ...S.card, border: '1px solid #fee2e2' }}>
        <p style={{ color: '#dc2626', fontWeight: '700', fontSize: '12px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>📋 Informasi</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '🪪', label: 'NIP', val: selectedProfile.nip || 'Guru Honorer (tidak ada NIP)' },

            { icon: '🕌', label: 'Agama', val: selectedProfile.agama || '-' },
            { icon: '🌏', label: 'Kewarganegaraan', val: selectedProfile.kewarganegaraan || 'WNI' },
            { icon: '📞', label: 'Telepon', val: selectedProfile.telpon && selectedProfile.telpon !== '-' ? selectedProfile.telpon : 'Belum diisi' },
            { icon: '📧', label: 'Email', val: selectedProfile.email && !selectedProfile.email.includes('@ejulu.sch.id') ? selectedProfile.email : 'Belum diisi' },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '700', margin: '0 0 1px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: '600', margin: 0 }}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );





  // ══════════════════════════════════════════════════════════════════
  // PESAN — guru kirim ke siswa mapelnya, tersimpan permanen
  // ══════════════════════════════════════════════════════════════════
  if (page === 'pesan') {
    // State pesan dikelola inline dengan useRef agar tidak re-render berlebihan
    return <PesanPage userData={userData} userRole={userRole} mapelList={mapelAktif} S={S} TopBar={TopBar} BackBtn={BackBtn} LoadingSpinner={LoadingSpinner} setPage={setPage} db={db} />;
  }


  // ══════════════════════════════════════════════════════════════════
  // PENGUMUMAN
  // ══════════════════════════════════════════════════════════════════
  if (page === 'pengumuman') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: '#f97316', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>📢 Pengumuman</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>Informasi penting dari sekolah</p>
      {pengumumanMsg && <div style={pengumumanMsg.startsWith('✅') ? S.successBox : S.errBox}>{pengumumanMsg}</div>}
      {/* Form kirim pengumuman — hanya admin & guru */}
      {(userRole === 'admin' || userRole === 'guru') && (
        <div style={{ ...S.card, border: '2px dashed #f97316', marginBottom: '16px' }}>
          <p style={{ color: '#f97316', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>➕ Buat Pengumuman</p>
          <label style={S.label}>Judul</label>
          <input style={S.input} placeholder="Judul pengumuman..." value={pengumumanForm.judul} onChange={e => setPengumumanForm(p => ({ ...p, judul: e.target.value }))} />
          <label style={S.label}>Isi</label>
          <textarea style={{ ...S.input, height: '80px', resize: 'none' }} placeholder="Tulis pengumuman lengkap di sini..." value={pengumumanForm.isi} onChange={e => setPengumumanForm(p => ({ ...p, isi: e.target.value }))} />
          <label style={S.label}>Untuk</label>
          <select style={S.select} value={pengumumanForm.target} onChange={e => setPengumumanForm(p => ({ ...p, target: e.target.value }))}>
            <option value="semua">🌐 Semua (Siswa & Guru)</option>
            <option value="siswa">🎓 Siswa saja</option>
            <option value="guru">👨‍🏫 Guru saja</option>
          </select>
          <button onClick={kirimPengumuman} style={{ ...S.btnOrange, marginTop: 0 }}>📢 Kirim Pengumuman</button>
        </div>
      )}
      {pengumumanLoading && <LoadingSpinner />}
      {!pengumumanLoading && pengumumanList.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📢</div>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Belum ada pengumuman.</p>
        </div>
      )}
      {pengumumanList.filter(p => p.target === 'semua' || p.target === userRole).map((p, i) => (
        <div key={p.id || i} style={{ ...S.card, border: '1px solid #fed7aa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '800', fontSize: '15px', margin: '0 0 3px', color: '#0f172a' }}>{p.judul}</p>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>📅 {p.waktu} · {p.pengirimNama} {p.pengirimRole === 'admin' ? '(Admin)' : '(Guru)'}</p>
            </div>
            {(userRole === 'admin' || p.pengirimId === userData?.uid) && (
              <button onClick={() => hapusPengumuman(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px' }}>✕</button>
            )}
          </div>
          <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{p.isi}</p>
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '10px', background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
              {p.target === 'semua' ? '🌐 Semua' : p.target === 'siswa' ? '🎓 Siswa' : '👨‍🏫 Guru'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // REKAP NILAI SISWA (siswa lihat nilai & progress sendiri)
  // ══════════════════════════════════════════════════════════════════
  if (page === 'rekapNilai') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
        <p style={{ color: '#10b981', fontSize: '20px', fontWeight: '900', margin: 0 }}>📊 Nilai Saya</p>
        {rekapSiswaList.length > 0 && (
          <button onClick={exportNilaiExcel} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 Export Excel
          </button>
        )}
      </div>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>Rekap seluruh hasil quiz dan poin kamu</p>
      {/* Ringkasan poin */}
      <div style={{ width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '16px', padding: '18px', marginBottom: '16px', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', margin: '0 0 8px' }}>TOTAL POIN KAMU</p>
        <p style={{ color: 'white', fontSize: '36px', fontWeight: '900', margin: '0 0 12px' }}>{(userData?.poinPG||0)+(userData?.poinEssay||0)+(userData?.poinModul||0)} <span style={{ fontSize: '14px', opacity: 0.8 }}>poin</span></p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[{ label: 'Quiz PG', val: userData?.poinPG||0 }, { label: 'Essay', val: userData?.poinEssay||0 }, { label: 'Modul', val: userData?.poinModul||0 }].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
              <p style={{ color: 'white', fontWeight: '900', fontSize: '18px', margin: '0 0 2px' }}>{s.val}</p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      {rekapSiswaLoading && <LoadingSpinner />}
      {!rekapSiswaLoading && rekapSiswaList.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📝</div>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Belum ada quiz yang dikerjakan.</p>
        </div>
      )}
      {rekapSiswaList.map((h, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px', color: '#0f172a' }}>{h.mapel} — {h.babJudul || 'Bab'}</p>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>📅 {h.timestamp ? new Date(h.timestamp.seconds*1000).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#10b981', fontWeight: '900', fontSize: '18px', margin: 0 }}>{h.poinPG || 0}<span style={{ fontSize: '11px', color: '#94a3b8' }}>/20</span></p>
              <p style={{ color: '#94a3b8', fontSize: '10px', margin: 0 }}>Poin PG</p>
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <p style={{ color: '#16a34a', fontWeight: '700', fontSize: '13px', margin: 0 }}>Essay: {h.nilaiEssay !== null && h.nilaiEssay !== undefined ? h.nilaiEssay + '/100' : '⏳ Menunggu'}</p>
            </div>
            <div style={{ flex: 1, background: '#eff6ff', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <p style={{ color: '#2563eb', fontWeight: '700', fontSize: '13px', margin: 0 }}>Modul: {h.modulDurasi||0} mnt</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // IMPORT MASSAL SISWA (admin only)
  // ══════════════════════════════════════════════════════════════════
  if (page === 'importSiswa') {
    const validCount = importPreview.filter(r => r.valid).length;
    const invalidCount = importPreview.filter(r => !r.valid).length;
    const thStyle = { padding: '9px 10px', background: '#1e3a8a', color: 'white', fontWeight: '700', fontSize: '11px', textAlign: 'center', borderRight: '1px solid #3b5fc0', whiteSpace: 'nowrap' };
    const tdStyle = (valid, even) => ({ padding: '7px 10px', fontSize: '11px', textAlign: 'center', background: !valid ? '#fef2f2' : even ? '#eff6ff' : 'white', color: !valid ? '#ef4444' : '#0f172a', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' });
    return (
      <div style={S.page}>
        <TopBar />
        <BackBtn to="adminDashboard" fn={() => goTo('adminDashboard')} />
        <p style={{ color: '#4f46e5', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>📥 Import Massal Siswa</p>
        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>Upload file Excel untuk mendaftarkan banyak siswa sekaligus</p>
        {importMsg && <div style={importMsg.startsWith('✅') ? S.successBox : importMsg.startsWith('❌') ? S.errBox : { ...S.successBox, background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>{importMsg}</div>}

        {/* Kartu 1: Download Template */}
        <div style={{ ...S.card, border: '1px solid #bfdbfe', background: 'linear-gradient(135deg,#eff6ff,#f0f4ff)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📋</div>
            <div>
              <p style={{ color: '#1e3a8a', fontWeight: '800', fontSize: '14px', margin: 0 }}>Template Excel</p>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>Kolom wajib: NISN, Nama, Email, Kelas, Jurusan</p>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '10px', padding: '10px', marginBottom: '12px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
              {['NISN','Nama','Kelas','Jurusan'].map((col, i) => (
                <div key={col} style={{ background: i < 2 ? '#1e3a8a' : '#eff6ff', color: i < 2 ? 'white' : '#2563eb', borderRadius: '6px', padding: '5px 4px', fontSize: '10px', fontWeight: '700', textAlign: 'center', border: i >= 2 ? '1px solid #bfdbfe' : 'none' }}>{col}</div>
              ))}
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '8px 10px', border: '1px solid #bbf7d0' }}>
              <p style={{ color: '#15803d', fontSize: '11px', fontWeight: '700', margin: 0 }}>🔐 Password default semua siswa: <span style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>ejulu123</span></p>
            </div>
          </div>
          <button onClick={downloadTemplateExcel} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            📥 Download Template Excel
          </button>
        </div>

        {/* Kartu 2: Upload */}
        <div style={{ ...S.card, border: '2px dashed #818cf8' }}>
          <p style={{ color: '#4f46e5', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>📤 Upload File Excel</p>
          <label style={{ width: '100%', padding: '18px', borderRadius: '12px', border: '1.5px dashed #93c5fd', background: '#eff6ff', color: '#2563eb', fontSize: '13px', fontWeight: '700', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '28px' }}>{importLoading ? '⏳' : '📂'}</span>
            {importLoading ? 'Sedang mengimport...' : 'Pilih File .xlsx'}
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>Kolom: NISN, NIS, Nama, Kelas, Jurusan, Tgl Lahir</span>
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImportExcel} disabled={importLoading} />
          </label>
        </div>

        {/* Kartu 3: Preview tabel */}
        {importPreview.length > 0 && (
          <div style={{ ...S.card, border: '1px solid #bbf7d0', padding: '0', overflow: 'hidden' }}>
            {/* Header kartu */}
            <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#15803d', fontWeight: '800', fontSize: '14px', margin: 0 }}>👁️ Preview Data</p>
                <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0' }}>
                  <span style={{ color: '#16a34a', fontWeight: '700' }}>{validCount} valid</span>
                  {invalidCount > 0 && <span style={{ color: '#ef4444', fontWeight: '700' }}> · {invalidCount} bermasalah</span>}
                  {' '}dari {importPreview.length} baris
                </p>
              </div>
              <div style={{ background: validCount === importPreview.length ? '#16a34a' : '#f59e0b', color: 'white', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700' }}>
                {validCount === importPreview.length ? '✅ Semua OK' : '⚠️ Ada masalah'}
              </div>
            </div>
            {/* Tabel */}
            <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '600px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    {['No','NISN','Nama','Kelas','Jurusan','Status'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((s, i) => (
                    <tr key={i}>
                      <td style={tdStyle(s.valid, i%2===0)}>{i+1}</td>
                      <td style={tdStyle(s.valid, i%2===0)}>{s.nisn || <span style={{color:'#ef4444'}}>❌</span>}</td>
                      <td style={{...tdStyle(s.valid, i%2===0), textAlign:'left', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis'}}>{s.nama || <span style={{color:'#ef4444'}}>❌ kosong</span>}</td>
                      <td style={tdStyle(s.valid, i%2===0)}>{s.kelas || <span style={{color:'#ef4444'}}>❌</span>}</td>
                      <td style={tdStyle(s.valid, i%2===0)}>{s.jurusan || <span style={{color:'#ef4444'}}>❌</span>}</td>
                      <td style={{...tdStyle(s.valid, i%2===0), fontWeight:'700'}}>{s.valid ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer aksi */}
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', margin: '0 0 6px' }}>🔐 Password Admin</p>
                <input type="password" placeholder="Masukkan password akun admin" value={adminPassSiswaImport} onChange={e => setAdminPassSiswaImport(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #86efac', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={mulaiImport} disabled={importLoading || validCount === 0 || !adminPassSiswaImport} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: validCount > 0 && adminPassSiswaImport ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#94a3b8', color: 'white', fontWeight: '700', fontSize: '14px', cursor: validCount > 0 && adminPassSiswaImport ? 'pointer' : 'not-allowed', marginBottom: '8px' }}>
                {importLoading ? importMsg || '⏳ Mengimport...' : `🚀 Import ${validCount} Siswa Sekarang`}
              </button>
              <p style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', margin: 0 }}>⚠️ Proses ini tidak bisa dibatalkan. Pastikan data sudah benar.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // #11 KALENDER AKADEMIK
  // ══════════════════════════════════════════════════════════════════
  if (page === 'kalender') {
    const tipeConfig = {
      umum:    { label: 'Umum',       icon: '📅', warna: '#6366f1', bg: '#eff6ff' },
      libur:   { label: 'Libur',      icon: '🏖️',  warna: '#f59e0b', bg: '#fffbeb' },
      ujian:   { label: 'Ujian',      icon: '📝',  warna: '#ef4444', bg: '#fef2f2' },
      kegiatan:{ label: 'Kegiatan',   icon: '🎉',  warna: '#10b981', bg: '#f0fdf4' },
    };
    const hari = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    const bulanNama = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const formatTgl = (tgl) => {
      if (!tgl) return '-';
      const d = new Date(tgl + 'T00:00:00');
      return `${hari[d.getDay()]}, ${d.getDate()} ${bulanNama[d.getMonth()]} ${d.getFullYear()}`;
    };
    const today = new Date().toISOString().slice(0, 10);
    const bolehKelola = userRole === 'admin' || userRole === 'guru';

    // Filter berdasarkan tab
    const filtered = kalenderTab === 'semua'
      ? kalenderList
      : kalenderTab === 'mendatang'
        ? kalenderList.filter(k => k.tanggal >= today)
        : kalenderList.filter(k => k.tipe === kalenderTab);

    // Kalender bulan ini — mini calendar
    const now = new Date();
    const tahunBulan = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const hariIniTglStr = now.toISOString().slice(0,10);
    const eventBulanIni = kalenderList.filter(k => k.tanggal && k.tanggal.startsWith(tahunBulan));

    return (
      <div style={S.page}>
        <TopBar />
        <BackBtn to="dashboard" />
        <p style={{ color: '#7c3aed', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>📅 Kalender Akademik</p>
        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>Jadwal kegiatan sekolah</p>

        {kalenderMsg && <div style={kalenderMsg.startsWith('✅') ? S.successBox : S.errBox}>{kalenderMsg}</div>}

        {/* Mini calendar bulan ini */}
        <div style={{ ...S.card, border: '1px solid #ede9fe', marginBottom: '16px' }}>
          <p style={{ color: '#7c3aed', fontWeight: '700', fontSize: '13px', margin: '0 0 10px' }}>
            📆 {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
            {['M','S','S','R','K','J','S'].map((h, i) => (
              <div key={i} style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', padding: '4px 0' }}>{h}</div>
            ))}
            {Array.from({ length: new Date(now.getFullYear(), now.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={'e' + i} />
            ))}
            {Array.from({ length: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() }).map((_, i) => {
              const tgl = i + 1;
              const tglStr = `${tahunBulan}-${String(tgl).padStart(2,'0')}`;
              const adaEvent = eventBulanIni.some(k => k.tanggal === tglStr || (k.tanggalAkhir && tglStr >= k.tanggal && tglStr <= k.tanggalAkhir));
              const isToday = tglStr === hariIniTglStr;
              return (
                <div key={tgl} style={{ padding: '5px 2px', borderRadius: '6px', background: isToday ? '#7c3aed' : adaEvent ? '#ede9fe' : 'transparent', color: isToday ? 'white' : adaEvent ? '#6d28d9' : '#0f172a', fontWeight: isToday || adaEvent ? '700' : '400', fontSize: '12px', position: 'relative' }}>
                  {tgl}
                  {adaEvent && !isToday && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#7c3aed', margin: '0 auto' }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter tab */}
        <div style={{ display: 'flex', gap: '6px', width: '100%', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[{ key: 'semua', label: '🗓️ Semua' }, { key: 'mendatang', label: '⏩ Mendatang' }, { key: 'ujian', label: '📝 Ujian' }, { key: 'libur', label: '🏖️ Libur' }, { key: 'kegiatan', label: '🎉 Kegiatan' }].map(t => (
            <button key={t.key} onClick={() => setKalenderTab(t.key)}
              style={{ padding: '8px 14px', borderRadius: '20px', border: 'none', background: kalenderTab === t.key ? '#7c3aed' : '#f1f5f9', color: kalenderTab === t.key ? 'white' : '#64748b', fontWeight: kalenderTab === t.key ? '700' : '600', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Form tambah kegiatan (admin/guru) */}
        {bolehKelola && (
          <div style={{ ...S.card, border: '2px dashed #a78bfa', marginBottom: '16px' }}>
            <p style={{ color: '#7c3aed', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>➕ Tambah Kegiatan</p>
            <label style={S.label}>Judul *</label>
            <input style={S.input} placeholder="Contoh: UTS Semester 1, Libur Natal..." value={kalenderForm.judul} onChange={e => setKalenderForm(p => ({ ...p, judul: e.target.value }))} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Tanggal Mulai *</label>
                <input style={S.input} type="date" value={kalenderForm.tanggal} onChange={e => setKalenderForm(p => ({ ...p, tanggal: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Tanggal Akhir</label>
                <input style={S.input} type="date" value={kalenderForm.tanggalAkhir} onChange={e => setKalenderForm(p => ({ ...p, tanggalAkhir: e.target.value }))} />
              </div>
            </div>
            <label style={S.label}>Tipe</label>
            <select style={S.select} value={kalenderForm.tipe} onChange={e => setKalenderForm(p => ({ ...p, tipe: e.target.value }))}>
              <option value="umum">📅 Umum</option>
              <option value="ujian">📝 Ujian / Penilaian</option>
              <option value="libur">🏖️ Libur</option>
              <option value="kegiatan">🎉 Kegiatan Sekolah</option>
            </select>
            <label style={S.label}>Deskripsi (opsional)</label>
            <textarea style={{ ...S.input, height: '70px', resize: 'none' }} placeholder="Info tambahan..." value={kalenderForm.deskripsi} onChange={e => setKalenderForm(p => ({ ...p, deskripsi: e.target.value }))} />
            <button onClick={tambahKalender} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              ✅ Tambahkan ke Kalender
            </button>
          </div>
        )}

        {kalenderLoading && <LoadingSpinner />}
        {!kalenderLoading && filtered.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📅</div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Belum ada kegiatan.</p>
          </div>
        )}
        {filtered.map((k, i) => {
          const cfg = tipeConfig[k.tipe] || tipeConfig.umum;
          const sudahLewat = k.tanggal < today;
          return (
            <div key={k.id || i} style={{ ...S.card, border: `1px solid ${cfg.warna}44`, background: sudahLewat ? '#f8fafc' : 'white', opacity: sudahLewat ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: cfg.bg, border: `1px solid ${cfg.warna}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{cfg.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 3px', color: sudahLewat ? '#94a3b8' : '#0f172a' }}>{k.judul}</p>
                    <p style={{ color: cfg.warna, fontSize: '11px', fontWeight: '700', margin: '0 0 2px' }}>
                      {formatTgl(k.tanggal)}{k.tanggalAkhir && k.tanggalAkhir !== k.tanggal ? ` — ${formatTgl(k.tanggalAkhir)}` : ''}
                    </p>
                    {k.deskripsi && <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0', lineHeight: '1.5' }}>{k.deskripsi}</p>}
                    <span style={{ fontSize: '10px', background: cfg.bg, color: cfg.warna, padding: '2px 8px', borderRadius: '6px', fontWeight: '700', display: 'inline-block', marginTop: '6px' }}>{cfg.icon} {cfg.label}</span>
                  </div>
                </div>
                {bolehKelola && (
                  <button onClick={() => hapusKalender(k.id, k.judul)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px', flexShrink: 0 }}>✕</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── IMPORT GURU ────────────────────────────────────────────────────
  if (page === 'importGuru') {
    const validCount = importGuruPreview.filter(r => r.valid).length;
    const invalidCount = importGuruPreview.filter(r => !r.valid).length;
    const thStyle = { padding: '9px 8px', background: '#7c3aed', color: 'white', fontWeight: '700', fontSize: '11px', textAlign: 'center', borderRight: '1px solid #a78bfa', whiteSpace: 'nowrap' };
    const tdStyle = (valid, even) => ({ padding: '7px 8px', fontSize: '11px', textAlign: 'center', background: !valid ? '#fef2f2' : even ? '#f5f3ff' : 'white', color: !valid ? '#ef4444' : '#0f172a', borderRight: '1px solid #ede9fe', borderBottom: '1px solid #ede9fe', whiteSpace: 'nowrap' });
    return (
      <div style={S.page}>
        <TopBar />
        <BackBtn to="adminDashboard" fn={() => goTo('adminDashboard')} />
        <p style={{ color: '#7c3aed', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>👨‍🏫 Import Massal Guru</p>
        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>Upload file Excel untuk mendaftarkan guru sekaligus</p>
        {importGuruMsg && <div style={importGuruMsg.startsWith('✅') ? S.successBox : importGuruMsg.startsWith('❌') ? S.errBox : { ...S.successBox, background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>{importGuruMsg}</div>}

        {/* Kartu template */}
        <div style={{ ...S.card, border: '1px solid #ede9fe', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📋</div>
            <div>
              <p style={{ color: '#5b21b6', fontWeight: '800', fontSize: '14px', margin: 0 }}>Template Excel Guru</p>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>NIP / NIK wajib diisi minimal satu</p>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: '10px', padding: '10px', marginBottom: '12px', border: '1px solid #ede9fe' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', marginBottom: '5px' }}>
              {['NIP','NIK','Nama Lengkap'].map(col => (
                <div key={col} style={{ background: '#7c3aed', color: 'white', borderRadius: '6px', padding: '5px 4px', fontSize: '10px', fontWeight: '700', textAlign: 'center' }}>{col}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
              {['Nama Panggilan','Jabatan','Mapel Diampu'].map(col => (
                <div key={col} style={{ background: '#f5f3ff', color: '#7c3aed', borderRadius: '6px', padding: '5px 4px', fontSize: '10px', fontWeight: '600', textAlign: 'center', border: '1px solid #ede9fe' }}>{col}</div>
              ))}
            </div>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '8px 10px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
            <p style={{ color: '#15803d', fontSize: '11px', fontWeight: '700', margin: 0 }}>🔐 Password default semua guru: <span style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>ejulu123</span></p>
          </div>
          <button onClick={downloadTemplateGuruExcel} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            📥 Download Template Excel Guru
          </button>
        </div>

        {/* Upload */}
        <div style={{ ...S.card, border: '2px dashed #a78bfa' }}>
          <p style={{ color: '#7c3aed', fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>📤 Upload File Excel</p>
          <label style={{ width: '100%', padding: '18px', borderRadius: '12px', border: '1.5px dashed #a78bfa', background: '#f5f3ff', color: '#7c3aed', fontSize: '13px', fontWeight: '700', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '28px' }}>{importGuruLoading ? '⏳' : '📂'}</span>
            {importGuruLoading ? 'Sedang mengimport...' : 'Pilih File .xlsx'}
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>File Excel dari template yang sudah diisi</span>
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImportGuruExcel} disabled={importGuruLoading} />
          </label>
        </div>

        {/* Preview tabel */}
        {importGuruPreview.length > 0 && (
          <div style={{ ...S.card, border: '1px solid #ddd6fe', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderBottom: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#5b21b6', fontWeight: '800', fontSize: '14px', margin: 0 }}>👁️ Preview Data</p>
                <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0' }}>
                  <span style={{ color: '#7c3aed', fontWeight: '700' }}>{validCount} valid</span>
                  {invalidCount > 0 && <span style={{ color: '#ef4444', fontWeight: '700' }}> · {invalidCount} bermasalah</span>}
                </p>
              </div>
              <div style={{ background: validCount === importGuruPreview.length ? '#7c3aed' : '#f59e0b', color: 'white', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700' }}>
                {validCount === importGuruPreview.length ? '✅ Semua OK' : '⚠️ Ada masalah'}
              </div>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '260px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '500px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    {['No','NIP','NIK','Nama','Mapel','Status'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importGuruPreview.map((g, i) => (
                    <tr key={i}>
                      <td style={tdStyle(g.valid, i%2===0)}>{i+1}</td>
                      <td style={tdStyle(g.valid, i%2===0)}>{g.nip || <span style={{color:'#94a3b8',fontSize:'10px'}}>-</span>}</td>
                      <td style={tdStyle(g.valid, i%2===0)}>{g.nik || <span style={{color:'#94a3b8',fontSize:'10px'}}>-</span>}</td>
                      <td style={{...tdStyle(g.valid, i%2===0), textAlign:'left', maxWidth:'130px', overflow:'hidden', textOverflow:'ellipsis'}}>{g.nama || <span style={{color:'#ef4444'}}>❌</span>}</td>
                      <td style={{...tdStyle(g.valid, i%2===0), textAlign:'left'}}>{g.mapelList?.join(', ') || g.mapel || '-'}</td>
                      <td style={{...tdStyle(g.valid, i%2===0), fontWeight:'700'}}>{g.valid ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', margin: '0 0 6px' }}>🔐 Password Admin</p>
                <input type="password" placeholder="Masukkan password akun admin" value={adminPassImport} onChange={e => setAdminPassImport(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #a78bfa', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={mulaiImportGuru} disabled={importGuruLoading || validCount === 0 || !adminPassImport} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: validCount > 0 && adminPassImport ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#94a3b8', color: 'white', fontWeight: '700', fontSize: '14px', cursor: validCount > 0 && adminPassImport ? 'pointer' : 'not-allowed', marginBottom: '8px' }}>
                {importGuruLoading ? importGuruMsg || '⏳ Mengimport...' : `🚀 Import ${validCount} Guru Sekarang`}
              </button>
              <p style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center', margin: 0 }}>⚠️ Proses ini tidak bisa dibatalkan.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── GANTI PASSWORD PERTAMA KALI ───────────────────────────────────
  if (page === 'gantiPasswordPertama') return (
    <div style={S.page}>
      <TopBar />
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}>🔐</div>
      <p style={{ color: '#7c3aed', fontSize: '20px', fontWeight: '900', marginBottom: '4px', textAlign: 'center' }}>Ganti Password</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px', textAlign: 'center' }}>Halo {userData?.nama?.split(' ')[0]}! Buat password baru sebelum mulai.</p>

      {gantiPassMsg && <div style={gantiPassMsg.startsWith('✅') ? S.successBox : S.errBox}>{gantiPassMsg}</div>}

      <div style={{ ...S.card, border: '2px solid #ede9fe', width: '100%' }}>
        <label style={S.label}>Password Baru</label>
        <div style={S.pwWrap}>
          <input style={{ ...S.input, marginBottom: 0, paddingRight: '40px' }} type={showGantiPass ? 'text' : 'password'} placeholder="Minimal 6 karakter" value={gantiPassBaru} onChange={e => setGantiPassBaru(e.target.value)} />
          <button type="button" style={S.eyeBtn} onClick={() => setShowGantiPass(v => !v)}>{showGantiPass ? '🙈' : '👁️'}</button>
        </div>
        <div style={{ height: '12px' }} />
        <label style={S.label}>Konfirmasi Password Baru</label>
        <div style={S.pwWrap}>
          <input style={{ ...S.input, marginBottom: 0, paddingRight: '40px' }} type={showGantiPassKonfirm ? 'text' : 'password'} placeholder="Ulangi password baru" value={gantiPassKonfirm} onChange={e => setGantiPassKonfirm(e.target.value)} />
          <button type="button" style={S.eyeBtn} onClick={() => setShowGantiPassKonfirm(v => !v)}>{showGantiPassKonfirm ? '🙈' : '👁️'}</button>
        </div>
      </div>

      <button onClick={submitGantiPasswordPertama} disabled={gantiPassLoading} style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginBottom: '16px', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
        {gantiPassLoading ? '⏳ Menyimpan...' : '🔐 Simpan Password Baru'}
      </button>

      {/* Peringatan penting */}
      <div style={{ width: '100%', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '14px', padding: '14px 16px' }}>
        <p style={{ color: '#92400e', fontSize: '12px', fontWeight: '700', margin: '0 0 6px' }}>⚠️ Penting — Harap diingat!</p>
        <p style={{ color: '#78350f', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }}>• Harap ingat password Anda. Admin <strong>tidak dapat</strong> melihat password Anda.</p>
        <p style={{ color: '#78350f', fontSize: '12px', margin: '0 0 4px', lineHeight: '1.6' }}>• Jika lupa password, hubungi admin untuk direset ke password default.</p>
        <p style={{ color: '#78350f', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>• Jangan bagikan password kepada siapapun.</p>
      </div>
    </div>
  );

  // ── LENGKAPI PROFIL ────────────────────────────────────────────────
  if (page === 'lengkapiProfil') return (
    <div style={S.page}>
      <TopBar />
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: userRole === 'guru' ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '16px', boxShadow: userRole === 'guru' ? '0 8px 24px rgba(220,38,38,0.3)' : '0 8px 24px rgba(14,165,233,0.3)' }}>{userRole === 'guru' ? '👨‍🏫' : '📋'}</div>
      <p style={{ color: userRole === 'guru' ? '#dc2626' : '#0284c7', fontSize: '20px', fontWeight: '900', marginBottom: '4px', textAlign: 'center' }}>Lengkapi Profil</p>
      <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '20px', textAlign: 'center' }}>Hai {userData?.namaPanggilan || userData?.nama?.split(' ')[0]}! Isi data diri agar profil lengkap</p>

      {lengkapMsg && <div style={lengkapMsg.startsWith('✅') ? S.successBox : S.errBox}>{lengkapMsg}</div>}

      <div style={{ ...S.card, border: `1px solid ${userRole === 'guru' ? '#fecaca' : '#bae6fd'}`, width: '100%' }}>

        {/* Nama Panggilan — khusus guru */}
        {userRole === 'guru' && (
          <>
            <label style={S.label}>Nama Panggilan</label>
            <input style={S.input} placeholder="Contoh: Pak Budi / Bu Siti" value={lengkapForm.namaPanggilan} onChange={e => setLengkapForm(p => ({ ...p, namaPanggilan: e.target.value }))} />
          </>
        )}

        <label style={S.label}>Jenis Kelamin *</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          {['Laki-laki','Perempuan'].map(jk => (
            <button key={jk} onClick={() => setLengkapForm(p => ({ ...p, jenisKelamin: jk }))}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${lengkapForm.jenisKelamin === jk ? (userRole==='guru'?'#dc2626':'#0284c7') : '#e2e8f0'}`, background: lengkapForm.jenisKelamin === jk ? (userRole==='guru'?'#fff1f2':'#eff6ff') : 'white', color: lengkapForm.jenisKelamin === jk ? (userRole==='guru'?'#dc2626':'#0284c7') : '#64748b', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              {jk === 'Laki-laki' ? '👦 Laki-laki' : '👧 Perempuan'}
            </button>
          ))}
        </div>

        <label style={S.label}>Agama *</label>
        <select style={S.select} value={lengkapForm.agama} onChange={e => setLengkapForm(p => ({ ...p, agama: e.target.value }))}>
          {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(a => <option key={a}>{a}</option>)}
        </select>

        <label style={S.label}>Kewarganegaraan *</label>
        <select style={S.select} value={lengkapForm.kewarganegaraan} onChange={e => setLengkapForm(p => ({ ...p, kewarganegaraan: e.target.value }))}>
          <option value="WNI">🇮🇩 WNI (Warga Negara Indonesia)</option>
          <option value="WNA">🌍 WNA (Warga Negara Asing)</option>
        </select>

        <label style={S.label}>Email Aktif *</label>
        <input style={S.input} type="email" placeholder="email@gmail.com" value={lengkapForm.email} onChange={e => setLengkapForm(p => ({ ...p, email: e.target.value }))} />

        <label style={S.label}>Nomor Telepon / HP *</label>
        <input style={S.input} type="tel" placeholder="08xxxxxxxxxx" value={lengkapForm.telpon} onChange={e => setLengkapForm(p => ({ ...p, telpon: e.target.value }))} />

        {/* Bio — khusus guru, wajib */}
        {userRole === 'guru' && (
          <>
            <label style={S.label}>Bio Singkat * <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '11px' }}>(tampil di profil publik)</span></label>
            <textarea style={{ ...S.input, height: '90px', resize: 'none' }} placeholder="Contoh: Guru Matematika dengan pengalaman 10 tahun. Senang membantu siswa memahami konsep dengan cara yang menyenangkan..." value={lengkapForm.bio} onChange={e => setLengkapForm(p => ({ ...p, bio: e.target.value }))} />
          </>
        )}
      </div>

      <button onClick={simpanLengkapProfil} disabled={lengkapLoading} style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: userRole === 'guru' ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: userRole === 'guru' ? '0 4px 14px rgba(220,38,38,0.3)' : '0 4px 14px rgba(14,165,233,0.3)' }}>
        {lengkapLoading ? '⏳ Menyimpan...' : userRole === 'guru' ? '✅ Simpan & Mulai Mengajar' : '✅ Simpan & Mulai Belajar'}
      </button>
    </div>
  );

  // fallback
  return <div style={S.page}><TopBar /><p style={{color:'#64748b'}}>Halaman tidak ditemukan</p></div>;
}

// ══════════════════════════════════════════════════════════════════
// PESAN PAGE COMPONENT (standalone agar tidak re-render App)
// ══════════════════════════════════════════════════════════════════
function PesanPage({ userData, userRole, mapelList, S, TopBar, BackBtn, LoadingSpinner, setPage, db }) {
  const [pesanList, setPesanList] = React.useState([]);
  const [pesanInput, setPesanInput] = React.useState('');
  const [targetSiswa, setTargetSiswa] = React.useState(null);
  const [siswaMapel, setSiswaMapel] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [inboxList, setInboxList] = React.useState([]);
  const [guruListSiswa, setGuruListSiswa] = React.useState([]);
  const [targetGuru, setTargetGuru] = React.useState(null);
  const [threadPesan, setThreadPesan] = React.useState([]);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => {
    if (userRole === 'guru') loadSiswaMapel();
    else { loadGuruListSiswa(); loadInboxSiswa(); }
  }, []);

  const loadSiswaMapel = async () => {
    setLoading(true);
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('role', '==', 'siswa'), where('status', '==', 'approved'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => d.data());
      list.sort((a, b) => a.nama.localeCompare(b.nama));
      setSiswaMapel(list);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadGuruListSiswa = async () => {
    setLoading(true);
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('role', '==', 'guru'), where('status', '==', 'approved'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => d.data());
      list.sort((a, b) => a.nama.localeCompare(b.nama));
      setGuruListSiswa(list);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadInboxSiswa = async () => {
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'pesan'), where('siswaId', '==', userData.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setInboxList(list);
    } catch (e) { console.error(e); }
  };

  const loadThread = async (guruId, siswaId) => {
    setLoading(true);
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'pesan'), where('guruId', '==', guruId), where('siswaId', '==', siswaId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setThreadPesan(list);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const kirimPesan = async () => {
    if (!pesanInput.trim() || !targetSiswa) return;
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const newPesan = {
        guruId: userData.uid,
        guruNama: userData.nama,
        guruMapel: userData.mapel || '',
        siswaId: targetSiswa.uid,
        siswaNama: targetSiswa.nama,
        siswaKelas: `${targetSiswa.kelas}${targetSiswa.jurusan}`,
        isi: pesanInput.trim(),
        pengirim: 'guru',
        timestamp: new Date(),
        waktu: new Date().toLocaleString('id-ID')
      };
      await addDoc(collection(db, 'pesan'), newPesan);
      setThreadPesan(prev => [...prev, { ...newPesan, timestamp: { seconds: Date.now()/1000 } }]);
      setPesanInput('');
      setMsg('✅ Pesan terkirim!');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg('❌ Gagal: ' + e.message); }
  };

  const kirimPesanSiswa = async () => {
    if (!pesanInput.trim() || !targetGuru) return;
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      const newPesan = {
        guruId: targetGuru.uid,
        guruNama: targetGuru.nama,
        guruMapel: targetGuru.mapel || '',
        siswaId: userData.uid,
        siswaNama: userData.nama,
        siswaKelas: `${userData.kelas}${userData.jurusan}`,
        isi: pesanInput.trim(),
        pengirim: 'siswa',
        timestamp: new Date(),
        waktu: new Date().toLocaleString('id-ID')
      };
      await addDoc(collection(db, 'pesan'), newPesan);
      setThreadPesan(prev => [...prev, { ...newPesan, timestamp: { seconds: Date.now()/1000 } }]);
      setPesanInput('');
      setMsg('✅ Pesan terkirim!');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg('❌ Gagal: ' + e.message); }
  };

  const formatWaktu = (ts) => {
    if (!ts) return '';
    const d = new Date((ts.seconds || ts/1000) * 1000);
    return d.toLocaleString('id-ID', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  };

  const [searchPesan, setSearchPesan] = React.useState('');

  // Guru: pilih siswa dulu, lalu chat
  if (userRole === 'guru') {
    if (!targetSiswa) {
      const filtered = siswaMapel.filter(s =>
        s.nama?.toLowerCase().includes(searchPesan.toLowerCase()) ||
        `${s.kelas}${s.jurusan}`.toLowerCase().includes(searchPesan.toLowerCase())
      );
      return (
        <div style={S.page}>
          <TopBar />
          <BackBtn to="dashboard" fn={() => setPage('dashboard')} />
          <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>💬 Pesan</p>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>Cari siswa untuk dikirim pesan</p>
          <input
            style={{ ...S.input, marginBottom: '14px' }}
            placeholder="🔍 Cari nama siswa atau kelas..."
            value={searchPesan}
            onChange={e => setSearchPesan(e.target.value)}
          />
          {loading && <LoadingSpinner />}
          {!loading && filtered.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}><p style={{ color: '#94a3b8' }}>{searchPesan ? 'Siswa tidak ditemukan.' : 'Belum ada siswa terdaftar.'}</p></div>}
          {filtered.map((s, i) => (
            <div key={i} onClick={() => { setTargetSiswa(s); loadThread(userData.uid, s.uid); }}
              style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, overflow: 'hidden' }}>
                {s.fotoUrl ? <img src={s.fotoUrl} alt={s.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (s.avatar || '🎓')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px', color: '#0f172a' }}>{s.nama}</p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Kelas {s.kelas}{s.jurusan}</p>
              </div>
              <span style={{ color: '#06b6d4', fontSize: '18px' }}>›</span>
            </div>
          ))}
        </div>
      );
    }

    // Chat dengan siswa terpilih
    return (
      <div style={{ ...S.page, paddingBottom: '120px' }}>
        <TopBar />
        <button onClick={() => setTargetSiswa(null)} style={{ ...S.btnBack, marginBottom: '8px' }}>‹ Kembali ke daftar</button>
        <div style={{ width: '100%', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{targetSiswa.avatar || '🎓'}</div>
          <div>
            <p style={{ color: 'white', fontWeight: '800', fontSize: '15px', margin: '0 0 2px' }}>{targetSiswa.nama}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>Kelas {targetSiswa.kelas}{targetSiswa.jurusan}</p>
          </div>
        </div>
        {msg && <div style={msg.startsWith('✅') ? S.successBox : S.errBox}>{msg}</div>}
        {loading && <LoadingSpinner />}
        {!loading && threadPesan.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}><p style={{ color: '#94a3b8', fontSize: '13px' }}>Belum ada pesan. Kirim pesan pertama!</p></div>}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {threadPesan.map((p, i) => {
            const dariGuru = (p.pengirim || 'guru') === 'guru';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: dariGuru ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '10px 14px', borderRadius: dariGuru ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: dariGuru ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : 'white', border: dariGuru ? 'none' : '1px solid #e2e8f0', maxWidth: '82%', boxShadow: dariGuru ? '0 2px 8px rgba(6,182,212,0.25)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <p style={{ color: dariGuru ? 'white' : '#0f172a', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{p.isi}</p>
                </div>
                <p style={{ fontSize: '10px', color: '#94a3b8', margin: '3px 0 0' }}>{!dariGuru ? `${targetSiswa.nama} · ` : ''}{formatWaktu(p.timestamp)}</p>
              </div>
            );
          })}
        </div>
        {/* Input */}
        <div style={{ position: 'fixed', bottom: '44px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: 'rgba(255,255,255,0.97)', borderTop: '1px solid #e2e8f0', padding: '10px 16px', boxSizing: 'border-box', backdropFilter: 'blur(20px)', zIndex: 100 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea style={{ ...S.input, flex: 1, height: '44px', marginBottom: 0, resize: 'none', padding: '10px 14px', fontSize: '14px' }} placeholder={`Pesan untuk ${targetSiswa.nama}...`} value={pesanInput} onChange={e => setPesanInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } }} />
            <button onClick={kirimPesan} disabled={!pesanInput.trim()} style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: pesanInput.trim() ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : '#e2e8f0', color: pesanInput.trim() ? 'white' : '#94a3b8', fontSize: '18px', cursor: pesanInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
          </div>
        </div>
      </div>
    );
  }

  // Siswa: search + pilih guru
  const [searchGuru, setSearchGuru] = React.useState('');
  const filteredGuru = guruListSiswa.filter(g =>
    g.nama?.toLowerCase().includes(searchGuru.toLowerCase()) ||
    g.mapel?.toLowerCase().includes(searchGuru.toLowerCase()) ||
    g.namaPanggilan?.toLowerCase().includes(searchGuru.toLowerCase())
  );

  if (!targetGuru) {
    return (
      <div style={S.page}>
        <TopBar />
        <BackBtn to="dashboard" fn={() => setPage('dashboard')} />
        <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>💬 Pesan</p>
        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>Cari guru untuk dikirim pesan</p>
        <input
          style={{ ...S.input, marginBottom: '14px' }}
          placeholder="🔍 Cari nama guru atau mapel..."
          value={searchGuru}
          onChange={e => setSearchGuru(e.target.value)}
        />
        {loading && <LoadingSpinner />}
        {!loading && filteredGuru.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{searchGuru ? 'Guru tidak ditemukan.' : 'Belum ada guru terdaftar.'}</p>
          </div>
        )}
        {filteredGuru.map((g, i) => (
          <div key={i} onClick={() => { setTargetGuru(g); loadThread(g.uid, userData.uid); }}
            style={{ ...S.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0, overflow: 'hidden' }}>
              {g.fotoUrl ? <img src={g.fotoUrl} alt={g.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (g.avatar || '👨‍🏫')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: '700', fontSize: '14px', margin: '0 0 2px', color: '#0f172a' }}>{g.namaPanggilan || g.nama}</p>
              <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 2px', fontWeight: '600' }}>{g.mapel || '-'}</p>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{g.jabatan || 'Guru'}</p>
            </div>
            <span style={{ color: '#dc2626', fontSize: '18px' }}>›</span>
          </div>
        ))}
      </div>
    );
  }

  // Thread chat dengan guru terpilih
  return (
    <div style={{ ...S.page, paddingBottom: '120px' }}>
      <TopBar />
      <button onClick={() => setTargetGuru(null)} style={{ ...S.btnBack, marginBottom: '8px' }}>‹ Kembali ke daftar</button>
      <div style={{ width: '100%', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{targetGuru.avatar || '👨‍🏫'}</div>
        <div>
          <p style={{ color: 'white', fontWeight: '800', fontSize: '15px', margin: '0 0 2px' }}>{targetGuru.nama}</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>{targetGuru.mapel}</p>
        </div>
      </div>
      {msg && <div style={msg.startsWith('✅') ? S.successBox : S.errBox}>{msg}</div>}
      {loading && <LoadingSpinner />}
      {!loading && threadPesan.length === 0 && <div style={{ ...S.card, textAlign: 'center', padding: '32px' }}><p style={{ color: '#94a3b8', fontSize: '13px' }}>Belum ada pesan. Kirim pesan pertama!</p></div>}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {threadPesan.map((p, i) => {
          const dariSiswa = p.pengirim === 'siswa';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: dariSiswa ? 'flex-end' : 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: dariSiswa ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: dariSiswa ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'white', border: dariSiswa ? 'none' : '1px solid #e2e8f0', maxWidth: '82%', boxShadow: dariSiswa ? '0 2px 8px rgba(220,38,38,0.25)' : '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p style={{ color: dariSiswa ? 'white' : '#0f172a', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>{p.isi}</p>
              </div>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '3px 0 0' }}>{formatWaktu(p.timestamp)}</p>
            </div>
          );
        })}
      </div>
      {/* Input */}
      <div style={{ position: 'fixed', bottom: '44px', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: 'rgba(255,255,255,0.97)', borderTop: '1px solid #e2e8f0', padding: '10px 16px', boxSizing: 'border-box', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea style={{ ...S.input, flex: 1, height: '44px', marginBottom: 0, resize: 'none', padding: '10px 14px', fontSize: '14px' }} placeholder={`Pesan untuk ${targetGuru.nama}...`} value={pesanInput} onChange={e => setPesanInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesanSiswa(); } }} />
          <button onClick={kirimPesanSiswa} disabled={!pesanInput.trim()} style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: pesanInput.trim() ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : '#e2e8f0', color: pesanInput.trim() ? 'white' : '#94a3b8', fontSize: '18px', cursor: pesanInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default App;

// ══════════════════════════════════════════════════════════════════
// ERROR BOUNDARY — tangkap error React dan tampilkan halaman ramah
// ══════════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('E-JULU Error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#e8f0ff,#f0f4ff)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Inter',system-ui,sans-serif", maxWidth: '430px', margin: '0 auto' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
          <p style={{ color: '#ef4444', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Ups, ada gangguan!</p>
          <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '24px', lineHeight: '1.7' }}>Aplikasi mengalami masalah tidak terduga. Coba refresh halaman ini atau hubungi Restuadi G. Sinaga, S.Kom.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '14px 32px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>🔄 Refresh Halaman</button>
          <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '24px' }}>✦ Development By Restuadi G. Sinaga, S.Kom ✦</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ══════════════════════════════════════════════════════════════════
// ADMIN TAMBAH MAPEL COMPONENT
// ══════════════════════════════════════════════════════════════════
function AdminTambahMapel({ mapelEditList, setMapelEditList, guruListForMapel, setAdminMsg, catatAktivitas, S, db }) {
  const [namaMapel, setNamaMapel] = React.useState('');
  const [iconMapel, setIconMapel] = React.useState('📚');
  const [warnaMapel, setWarnaMapel] = React.useState('#6366f1');
  const iconOptions = ['📚','📐','🌐','⚡','🧪','🧬','🏛️','🌍','📊','👥','⚽','🎨','💻','🇮🇩','🕌','🗣️','🔬','📖','✏️','🎵'];

  const tambahMapelBaru = async () => {
    if (!namaMapel.trim()) { setAdminMsg('❌ Nama mapel wajib diisi!'); setTimeout(() => setAdminMsg(''), 2000); return; }
    const exists = mapelEditList.find(m => m.nama.toLowerCase() === namaMapel.trim().toLowerCase());
    if (exists) { setAdminMsg('❌ Mapel sudah ada!'); setTimeout(() => setAdminMsg(''), 2000); return; }
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const id = 'mapel_custom_' + Date.now();
      const newMapel = { id, nama: namaMapel.trim(), icon: iconMapel, warna: warnaMapel, guruId: '', guruNama: '', urutan: mapelEditList.length + 1, custom: true };
      await setDoc(doc(db, 'masterMapel', id), newMapel);
      setMapelEditList(prev => [...prev, newMapel]);
      await catatAktivitas('TAMBAH_MAPEL', `Mapel baru: ${namaMapel}`);
      setAdminMsg(`✅ Mapel "${namaMapel}" berhasil ditambahkan!`);
      setNamaMapel('');
      setTimeout(() => setAdminMsg(''), 3000);
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
  };

  return (
    <div>
      <label style={S.label}>Nama Mapel *</label>
      <input style={S.input} placeholder="Contoh: Prakarya, TIK, Bahasa Jepang..." value={namaMapel} onChange={e => setNamaMapel(e.target.value)} />
      <label style={S.label}>Pilih Ikon</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {iconOptions.map((ic, i) => (
          <button key={i} onClick={() => setIconMapel(ic)}
            style={{ padding: '8px', borderRadius: '8px', border: iconMapel === ic ? '2px solid #6366f1' : '1px solid #e2e8f0', background: iconMapel === ic ? '#eff6ff' : 'white', fontSize: '20px', cursor: 'pointer' }}>
            {ic}
          </button>
        ))}
      </div>
      <label style={S.label}>Warna Mapel</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#d97706','#16a34a','#dc2626'].map(w => (
          <button key={w} onClick={() => setWarnaMapel(w)}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: w, border: warnaMapel === w ? '3px solid #0f172a' : '2px solid white', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
        ))}
      </div>
      {/* Preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px 14px', background: `${warnaMapel}15`, border: `1px solid ${warnaMapel}44`, borderRadius: '10px' }}>
        <span style={{ fontSize: '24px' }}>{iconMapel}</span>
        <span style={{ fontWeight: '700', color: warnaMapel, fontSize: '14px' }}>{namaMapel || 'Nama Mapel'}</span>
      </div>
      <button onClick={tambahMapelBaru} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
        ➕ Tambah Mapel ke Aplikasi
      </button>
    </div>
  );
}
