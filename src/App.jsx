import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection,
  getDocs, updateDoc, addDoc, deleteDoc, query, where
} from 'firebase/firestore';

// ── ADMIN CREDENTIALS ─────────────────────────────────────────
const ADMIN_EMAIL = 'admin@ejulu.com';
const ADMIN_PASSWORD = 'admin123';

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
  const [selectedKelas, setSelectedKelas] = useState(null); // { tingkat: '10', jurusan: 'A' } untuk guru, atau dari userData siswa
  const [guruPilihTingkat, setGuruPilihTingkat] = useState(null); // '10'/'11'/'12'

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
  // FIX 1: Tambah field nip dan nik di guruForm agar tidak crash
  const [guruForm, setGuruForm] = useState({
    nip:'', nik:'', nama:'', namaPanggilan:'', mapel:'',
    jabatan:'', email:'', password:'', konfirmasi:'', bio:''
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

  // Quiz
  const [quizSoalIndex, setQuizSoalIndex] = useState(0);
  const [quizJawaban, setQuizJawaban] = useState({});
  const [quizSelesai, setQuizSelesai] = useState(false);
  const [quizSoalAcak, setQuizSoalAcak] = useState([]);
  const [timer, setTimer] = useState(20);
  const timerRef = useRef(null);

  // FIX 2: Tambah flag untuk mencegah simpanHasilQuiz dipanggil berulang
  const hasilTersimpan = useRef(false);

  // Durasi
  const [modulDurasi, setModulDurasi] = useState(0);
  const [videoDurasi, setVideoDurasi] = useState(0);
  const modulTimerRef = useRef(null);
  const videoTimerRef = useRef(null);

  // Bab & Quiz dari Firestore
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

  // ── ADMIN STATE ───────────────────────────────────────────────
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

  // ── PENGATURAN STATE ──────────────────────────────────────────
  const [pengaturanMsg, setPengaturanMsg] = useState('');
  const [editBioForm, setEditBioForm] = useState({ bio: '', citaCita: '', hobby: '' });
  const [gantiPwForm, setGantiPwForm] = useState({ baru: '', konfirmasi: '' });
  const [showGantiPw, setShowGantiPw] = useState(false);
  const [showKonfirmasiPw, setShowKonfirmasiPw] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // ── ABOUT STATE ───────────────────────────────────────────────
  const [aboutData, setAboutData] = useState({ namaSekolah: 'SMA NEGERI 1 LUMBANJULU', namaKepsek: '', jabatanKepsek: 'Kepala Sekolah', tentang: '', visi: '', misi: '', fotoSekolah: '', fotoKepsek: '' });
  const [aboutLoaded, setAboutLoaded] = useState(false);

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
              setPage('dashboard');
            } else if (data.status === 'pending') {
              setPage('menunggu');
            } else {
              setPage('ditolak');
            }
          } else {
            // FIX 3: Jika dokumen user tidak ada di Firestore, sign out dan ke halaman role
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

  // ── Deteksi keluar saat quiz ───────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && page === 'quiz') {
        clearInterval(timerRef.current);
        setPage('loginSiswa');
        setQuizJawaban({});
        setQuizSoalIndex(0);
        setQuizSelesai(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [page]);

  // ── Timer quiz ────────────────────────────────────────────────
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

  // ── Load bab dari Firestore ────────────────────────────────────
  const loadBab = async (mapelNama) => {
    const q = query(collection(db, 'bab'), where('mapel', '==', mapelNama));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => a.urutan - b.urutan);
    setBabList(list);
  };

  // Load soal quiz dari Firestore
  const loadSoal = async (babId) => {
    const q = query(collection(db, 'soal'), where('babId', '==', babId));
    const snap = await getDocs(q);
    setQuizSoalList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Load hasil siswa — filter by babId AND kelas+jurusan untuk guru
  const loadHasilSiswa = async (babId, filterKelas) => {
    let q;
    if (filterKelas) {
      // guru lihat hasil spesifik kelas misal "10A"
      q = query(collection(db, 'hasilQuiz'),
        where('babId', '==', babId),
        where('siswaKelas', '==', filterKelas));
    } else {
      q = query(collection(db, 'hasilQuiz'), where('babId', '==', babId));
    }
    const snap = await getDocs(q);
    setHasilSiswa(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ── Timer modul & video ────────────────────────────────────────
  const mulaiTimerModul = () => {
    modulTimerRef.current = setInterval(() => setModulDurasi(p => p + 1), 60000);
  };
  const stopTimerModul = () => clearInterval(modulTimerRef.current);
  const mulaiTimerVideo = () => {
    videoTimerRef.current = setInterval(() => setVideoDurasi(p => p + 1), 60000);
  };
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

  // ── Simpan hasil quiz ke Firestore ─────────────────────────────
  // FIX 4: Tidak lagi dipanggil saat render — dipanggil saat quizSelesai berubah jadi true
  useEffect(() => {
    if (quizSelesai && !hasilTersimpan.current) {
      hasilTersimpan.current = true;
      simpanHasilQuiz();
    }
  }, [quizSelesai]);

  const simpanHasilQuiz = async () => {
    if (!userData || !selectedBab) return;
    const poinPG = hitungPoinPG();
    const essayJawaban = quizSoalAcak
      .filter(s => s.tipe === 'essay')
      .map(s => ({ soalId: s.id, soal: s.soal, jawaban: quizJawaban[s.id] || '' }));

    try {
      await addDoc(collection(db, 'hasilQuiz'), {
        babId: selectedBab.id,
        mapel: selectedMapel.nama,
        siswaId: userData.uid,
        siswaNama: userData.nama,
        siswaKelas: `${userData.kelas}${userData.jurusan}`,
        poinPG,
        essayJawaban,
        nilaiEssay: null,
        modulDurasi,
        videoDurasi,
        timestamp: new Date()
      });

      await updateDoc(doc(db, 'users', userData.uid), {
        poinPG: (userData.poinPG || 0) + poinPG,
        poinModul: hitungPoinModul()
      });
    } catch (err) {
      console.error('Gagal simpan hasil quiz:', err);
    }
  };

  // ── Kamera ────────────────────────────────────────────────────
  const startKameraSiswa = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch { alert('Kamera tidak bisa diakses. Pastikan izin kamera sudah diberikan.'); }
  };

  const ambilFotoSiswa = () => {
    const c = canvasRef.current, v = videoRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.7);
    setFotoDataUrl(dataUrl);
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
    const dataUrl = c.toDataURL('image/jpeg', 0.7);
    setFotoGuruDataUrl(dataUrl);
    setFotoGuruDiambil(true);
    v.srcObject.getTracks().forEach(t => t.stop());
    setCameraGuruActive(false);
  };

  const updateSiswaForm = (k, v) => setSiswaForm(p => ({ ...p, [k]: v }));
  const updateGuruForm = (k, v) => setGuruForm(p => ({ ...p, [k]: v }));

  // ── Registrasi Siswa ───────────────────────────────────────────
  const registrasiSiswa = async () => {
    const f = siswaForm;
    if (!f.nisn||!f.nama||!f.tglLahir||!f.email||!f.telpon||!f.agama||
        !f.password||!f.konfirmasi||!f.kelas||!f.jurusan||!f.citaCita||!f.hobby||!f.bio) {
      setSiswaError('Semua field wajib diisi!'); return;
    }
    if (f.password !== f.konfirmasi) { setSiswaError('Password tidak cocok!'); return; }
    if (f.password.length < 6) { setSiswaError('Password minimal 6 karakter!'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      const fotoUrl = fotoDataUrl || '';

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, role: 'siswa', status: 'pending',
        nisn: f.nisn, nama: f.nama, tglLahir: f.tglLahir,
        email: f.email, telpon: f.telpon, agama: f.agama,
        kelas: f.kelas, jurusan: f.jurusan, citaCita: f.citaCita,
        hobby: f.hobby, bio: f.bio, fotoUrl: fotoUrl,
        poinPG: 0, poinEssay: 0, poinModul: 0,
        pelanggaran: 0, createdAt: new Date()
      });
      await signOut(auth);
      setSiswaError('');
      setPage('menunggu');
    } catch (e) {
      setSiswaError(e.message.includes('email-already-in-use')
        ? 'Email sudah terdaftar!' : 'Gagal mendaftar: ' + e.message);
    }
    setLoading(false);
  };

  // ── Registrasi Guru ────────────────────────────────────────────
  const registrasiGuru = async () => {
    const f = guruForm;
    if (!f.nama||!f.namaPanggilan||!f.mapel||!f.jabatan||
        !f.email||!f.password||!f.konfirmasi||!f.bio) {
      setGuruError('Semua field wajib diisi!'); return;
    }
    // FIX 5: Cek nip/nik dengan benar (kedua field sudah ada di state)
    if (!f.nip && !f.nik) { setGuruError('NIP atau NIK wajib diisi!'); return; }
    if (f.password !== f.konfirmasi) { setGuruError('Password tidak cocok!'); return; }
    if (f.password.length < 6) { setGuruError('Password minimal 6 karakter!'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      const fotoUrl = fotoGuruDataUrl || '';

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, role: 'guru', status: 'pending',
        nip: f.nip || '', nik: f.nik || '',
        nama: f.nama, namaPanggilan: f.namaPanggilan,
        mapel: f.mapel, jabatan: f.jabatan,
        email: f.email, bio: f.bio, fotoUrl,
        poinUpload: 0, poinNilai: 0,
        pelanggaran: 0, createdAt: new Date()
      });
      await signOut(auth);
      setGuruError('');
      setPage('menunggu');
    } catch (e) {
      setGuruError(e.message.includes('email-already-in-use')
        ? 'Email sudah terdaftar!' : 'Gagal mendaftar: ' + e.message);
    }
    setLoading(false);
  };

  // ── Login Siswa ────────────────────────────────────────────────
  const loginSiswa = async () => {
    if (!siswaLoginNISN || !siswaLoginPassword) {
      setLoginError('NISN dan password wajib diisi!'); return;
    }
    setLoading(true);
    setLoginError('');
    try {
      const q = query(collection(db, 'users'),
        where('nisn', '==', siswaLoginNISN),
        where('role', '==', 'siswa'));
      const snap = await getDocs(q);
      if (snap.empty) { setLoginError('NISN tidak ditemukan!'); setLoading(false); return; }
      const siswaData = snap.docs[0].data();
      if (siswaData.status === 'pending') {
        setLoginError('Akun belum disetujui admin!'); setLoading(false); return;
      }
      if (siswaData.status === 'rejected') {
        setLoginError('Akun ditolak. Hubungi admin sekolah.'); setLoading(false); return;
      }
      await signInWithEmailAndPassword(auth, siswaData.email, siswaLoginPassword);
      setUserData(siswaData);
      setUserRole('siswa');
      setPage('dashboard');
    } catch (e) {
      setLoginError('Password salah!');
    }
    setLoading(false);
  };

  // ── Login Guru ─────────────────────────────────────────────────
  const loginGuru = async () => {
    if (!guruLoginNIP || !guruLoginPassword) {
      setLoginError('NIP/NIK dan password wajib diisi!'); return;
    }
    setLoading(true);
    setLoginError('');
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'guru'));
      const snap = await getDocs(q);
      const guruDoc = snap.docs.find(d => {
        const data = d.data();
        return data.nip === guruLoginNIP || data.nik === guruLoginNIP;
      });
      if (!guruDoc) { setLoginError('NIP/NIK tidak ditemukan!'); setLoading(false); return; }
      const guruData = guruDoc.data();
      if (guruData.status === 'pending') {
        setLoginError('Akun belum disetujui admin!'); setLoading(false); return;
      }
      if (guruData.status === 'rejected') {
        setLoginError('Akun ditolak. Hubungi admin sekolah.'); setLoading(false); return;
      }
      await signInWithEmailAndPassword(auth, guruData.email, guruLoginPassword);
      setUserData(guruData);
      setUserRole('guru');
      setPage('dashboard');
    } catch (e) {
      setLoginError('Password salah!');
    }
    setLoading(false);
  };

  // ── ADMIN FUNCTIONS ───────────────────────────────────────────
  const loginAdmin = () => {
    if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
      setAdminError('');
      loadAdminUsers('pending');
      setAdminTab('pending');
      setPage('adminDashboard');
    } else {
      setAdminError('Email atau password admin salah!');
    }
  };

  const loadAdminUsers = async (status) => {
    setAdminLoading(true);
    try {
      let snap;
      if (status === 'all' || status === 'approved') {
        snap = status === 'all'
          ? await getDocs(collection(db, 'users'))
          : await getDocs(query(collection(db, 'users'), where('status', '==', 'approved')));
      } else {
        snap = await getDocs(query(collection(db, 'users'), where('status', '==', status)));
      }
      setAdminUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setAdminLoading(false);
  };

  const approveUser = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { status: 'approved' });
    setAdminMsg('✅ Akun berhasil disetujui!');
    setAdminUsers(prev => prev.filter(u => u.uid !== uid));
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const rejectUser = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
    setAdminMsg('❌ Akun berhasil ditolak!');
    setAdminUsers(prev => prev.filter(u => u.uid !== uid));
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const hapusUser = async (uid) => {
    if (!window.confirm('Yakin hapus user ini dari sistem?')) return;
    await deleteDoc(doc(db, 'users', uid));
    setAdminMsg('🗑️ User berhasil dihapus!');
    setAdminUsers(prev => prev.filter(u => u.uid !== uid));
    setSelectedUser(null);
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const simpanEditPoin = async (uid) => {
    const p = editPoinForm;
    const updateData = {};
    if (p.poinPG !== undefined) updateData.poinPG = Number(p.poinPG);
    if (p.poinEssay !== undefined) updateData.poinEssay = Number(p.poinEssay);
    if (p.poinModul !== undefined) updateData.poinModul = Number(p.poinModul);
    if (p.poinUpload !== undefined) updateData.poinUpload = Number(p.poinUpload);
    if (p.poinNilai !== undefined) updateData.poinNilai = Number(p.poinNilai);
    if (p.pelanggaran !== undefined) updateData.pelanggaran = Number(p.pelanggaran);
    await updateDoc(doc(db, 'users', uid), updateData);
    setAdminMsg('✅ Poin berhasil diperbarui!');
    setAdminUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...updateData } : u));
    setSelectedUser(prev => ({ ...prev, ...updateData }));
    setTimeout(() => setAdminMsg(''), 3000);
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setAdminMsg('📧 Email reset password terkirim ke ' + email);
    } catch (e) {
      setAdminMsg('❌ Gagal kirim email: ' + e.message);
    }
    setTimeout(() => setAdminMsg(''), 4000);
  };

  const simpanAppSettings = async () => {
    await setDoc(doc(db, 'settings', 'app'), appSettings);
    setAdminMsg('✅ Pengaturan aplikasi tersimpan!');
    setTimeout(() => setAdminMsg(''), 3000);
  };

  // ── PENGATURAN FUNCTIONS ─────────────────────────────────────
  const simpanEditProfil = async () => {
    if (!userData) return;
    const updateData = {};
    if (editBioForm.bio.trim()) updateData.bio = editBioForm.bio.trim();
    if (editBioForm.citaCita.trim()) updateData.citaCita = editBioForm.citaCita.trim();
    if (editBioForm.hobby.trim()) updateData.hobby = editBioForm.hobby.trim();
    if (selectedAvatar) updateData.avatar = selectedAvatar;
    if (Object.keys(updateData).length === 0) { setPengaturanMsg('Tidak ada perubahan.'); return; }
    try {
      await updateDoc(doc(db, 'users', userData.uid), updateData);
      setUserData(prev => ({ ...prev, ...updateData }));
      setPengaturanMsg('✅ Profil berhasil diperbarui!');
    } catch (e) { setPengaturanMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setPengaturanMsg(''), 3000);
  };

  const gantiPassword = async () => {
    if (!gantiPwForm.baru || !gantiPwForm.konfirmasi) { setPengaturanMsg('Isi semua field password!'); return; }
    if (gantiPwForm.baru.length < 6) { setPengaturanMsg('Password minimal 6 karakter!'); return; }
    if (gantiPwForm.baru !== gantiPwForm.konfirmasi) { setPengaturanMsg('Password tidak cocok!'); return; }
    try {
      await sendPasswordResetEmail(auth, userData.email);
      setPengaturanMsg('📧 Link ganti password dikirim ke email kamu!');
      setGantiPwForm({ baru: '', konfirmasi: '' });
    } catch (e) { setPengaturanMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setPengaturanMsg(''), 4000);
  };

  // ── ABOUT FUNCTIONS ───────────────────────────────────────────
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
      setAdminMsg('✅ Halaman Tentang berhasil disimpan!');
    } catch (e) { setAdminMsg('❌ Gagal: ' + e.message); }
    setTimeout(() => setAdminMsg(''), 3000);
  };

  // ── Logout ─────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    setUserRole(null);
    // FIX 6: Reset loginError saat logout agar tidak muncul lagi
    setLoginError('');
    setPage('role');
  };

  // ── Tambah Bab ─────────────────────────────────────────────────
  const tambahBab = async () => {
    if (!babBaru.trim()) return;
    const docRef = await addDoc(collection(db, 'bab'), {
      mapel: selectedMapel.nama, judul: babBaru,
      modul: '', modul2: '', video: '',
      urutan: babList.length + 1, createdAt: new Date()
    });
    setBabList(prev => [...prev, {
      id: docRef.id, mapel: selectedMapel.nama, judul: babBaru,
      modul: '', modul2: '', video: '', urutan: babList.length + 1
    }]);
    setBabBaru('');
  };

  const hapusBab = async (babId) => {
    await deleteDoc(doc(db, 'bab', babId));
    setBabList(prev => prev.filter(b => b.id !== babId));
  };

  const simpanJudulBab = async (babId, judul) => {
    await updateDoc(doc(db, 'bab', babId), { judul });
    setEditBab(null);
  };

  const simpanLinkBab = async (field) => {
    await updateDoc(doc(db, 'bab', selectedBab.id), { [field]: linkEdit[field] });
    setBabList(prev => prev.map(b => b.id === selectedBab.id ? { ...b, [field]: linkEdit[field] } : b));
    setSelectedBab(prev => ({ ...prev, [field]: linkEdit[field] }));
    alert('Link tersimpan!');
  };

  // ── Tambah/Hapus Soal ──────────────────────────────────────────
  const tambahSoalPG = async () => {
    if (!soalBaru.soal.trim()) return;
    const docRef = await addDoc(collection(db, 'soal'), {
      babId: selectedBab.id, mapel: selectedMapel.nama,
      tipe: 'pg', soal: soalBaru.soal,
      opsi: soalBaru.opsi, kunci: soalBaru.kunci,
      createdAt: new Date()
    });
    setQuizSoalList(prev => [...prev, { id: docRef.id, ...soalBaru, babId: selectedBab.id }]);
    setSoalBaru({ tipe: 'pg', soal: '', opsi: ['A. ', 'B. ', 'C. ', 'D. ', 'E. '], kunci: 'A' });
  };

  const tambahSoalEssay = async () => {
    if (!essayBaru.trim()) return;
    const docRef = await addDoc(collection(db, 'soal'), {
      babId: selectedBab.id, mapel: selectedMapel.nama,
      tipe: 'essay', soal: essayBaru, opsi: [], kunci: '',
      createdAt: new Date()
    });
    setQuizSoalList(prev => [...prev, { id: docRef.id, tipe: 'essay', soal: essayBaru, babId: selectedBab.id }]);
    setEssayBaru('');
  };

  const hapusSoal = async (soalId) => {
    await deleteDoc(doc(db, 'soal', soalId));
    setQuizSoalList(prev => prev.filter(s => s.id !== soalId));
  };

  const simpanNilaiEssay = async (hasilId, nilai, index) => {
    await updateDoc(doc(db, 'hasilQuiz', hasilId), { nilaiEssay: Number(nilai) });
    setHasilSiswa(prev => prev.map((h, i) => i === index ? { ...h, nilaiEssay: Number(nilai) } : h));
    alert('Nilai essay tersimpan!');
  };

  // ── STYLES (REDESIGNED) ──────────────────────────────────────
  const S = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#04091a 0%,#071428 40%,#0a1f3a 70%,#04091a 100%)',
      color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 18px 80px', fontFamily: "'Segoe UI',system-ui,sans-serif",
      maxWidth: '430px', margin: '0 auto',
    },
    input: {
      width: '100%', padding: '13px 16px', borderRadius: '12px',
      border: '1.5px solid rgba(0,200,255,0.2)',
      background: 'rgba(0,200,255,0.06)',
      color: 'white', fontSize: '14px', marginBottom: '12px',
      outline: 'none', boxSizing: 'border-box',
    },
    label: { fontSize: '11px', color: 'rgba(130,200,255,0.75)', marginBottom: '5px', display: 'block', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase' },
    select: {
      width: '100%', padding: '13px 16px', borderRadius: '12px',
      border: '1.5px solid rgba(0,200,255,0.2)', background: 'rgba(4,15,35,0.95)',
      color: 'white', fontSize: '14px', marginBottom: '12px',
      outline: 'none', boxSizing: 'border-box',
    },
    btnBack: {
      alignSelf: 'flex-start',
      background: 'rgba(0,200,255,0.08)',
      border: '1px solid rgba(0,200,255,0.3)', color: '#00c8ff', fontSize: '13px',
      fontWeight: '700', padding: '8px 18px', borderRadius: '30px',
      cursor: 'pointer', marginBottom: '18px',
    },
    btnOrange: {
      width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
      background: 'linear-gradient(135deg,#ff8c00,#e05000)',
      color: 'white', fontWeight: '800', fontSize: '16px',
      cursor: 'pointer', marginTop: '8px',
      boxShadow: '0 8px 28px rgba(255,100,0,0.3)',
    },
    btnBlue: {
      flex: 1, padding: '18px', borderRadius: '16px',
      border: '1px solid rgba(0,200,255,0.35)',
      background: 'linear-gradient(160deg,rgba(0,80,180,0.7),rgba(0,40,120,0.9))',
      cursor: 'pointer', fontWeight: '800', fontSize: '18px',
      backdropFilter: 'blur(8px)',
    },
    btnTeal: {
      width: '100%', padding: '17px 20px', borderRadius: '16px', border: 'none',
      background: 'linear-gradient(135deg,rgba(0,160,130,0.85),rgba(0,110,90,0.95))',
      color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer',
      marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px',
      boxShadow: '0 6px 20px rgba(0,160,130,0.2)',
    },
    btnGold: {
      width: '100%', padding: '17px 20px', borderRadius: '16px', border: 'none',
      background: 'linear-gradient(135deg,rgba(200,130,0,0.9),rgba(150,90,0,0.95))',
      color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '14px',
      boxShadow: '0 6px 20px rgba(200,130,0,0.2)',
    },
    pwWrap: { position: 'relative', width: '100%' },
    eyeBtn: {
      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-65%)',
      background: 'none', border: 'none', color: 'rgba(130,200,255,0.5)', cursor: 'pointer', fontSize: '15px',
    },
    errBox: {
      background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,80,80,0.35)',
      borderRadius: '12px', padding: '12px 16px',
      color: '#ff8080', fontSize: '13px', marginBottom: '14px', width: '100%',
    },
    successBox: {
      background: 'rgba(0,210,120,0.1)', border: '1px solid rgba(0,210,120,0.35)',
      borderRadius: '12px', padding: '12px 16px',
      color: '#00d278', fontSize: '13px', marginBottom: '14px', width: '100%',
    },
    card: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(0,200,255,0.1)',
      borderRadius: '16px', padding: '16px', width: '100%', marginBottom: '12px',
    },
    linkBtn: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 18px', borderRadius: '12px', color: 'white',
      fontWeight: '700', fontSize: '14px', textDecoration: 'none',
    },
  };

  const TopBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px', width: '100%' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#0066ff,#00aaff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 14px rgba(0,150,255,0.4)' }}>📚</div>
      <div>
        <span style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '2px' }}>E-JULU</span>
        <div style={{ fontSize: '9px', color: 'rgba(0,200,255,0.7)', letterSpacing: '1.5px', marginTop: '-2px' }}>E-LEARNING PLATFORM</div>
      </div>
    </div>
  );

  const Footer = () => (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px',
      background: 'rgba(4,9,26,0.95)',
      borderTop: '1px solid rgba(0,200,255,0.15)', padding: '10px 16px',
      textAlign: 'center', fontSize: '11px', color: 'rgba(0,200,255,0.5)',
      fontWeight: '600', zIndex: 999, backdropFilter: 'blur(20px)',
      letterSpacing: '0.5px',
    }}>✦ Development By Restuadi G. Sinaga, S.Kom ✦</div>
  );

  const BackBtn = ({ to, fn }) => (
    <button style={S.btnBack} onClick={() => { if (fn) fn(); else setPage(to); }}>‹ Kembali</button>
  );

  const PwInput = ({ placeholder, val, setVal, show, setShow }) => (
    <div style={S.pwWrap}>
      <input style={{ ...S.input, paddingRight: '40px' }}
        type={show ? 'text' : 'password'} placeholder={placeholder}
        value={val} onChange={e => setVal(e.target.value)} />
      <button style={S.eyeBtn} onClick={() => setShow(!show)}>{show ? '🙈' : '👁️'}</button>
    </div>
  );

  const LoadingSpinner = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(0,200,255,0.15)', borderTop: '3px solid #00c8ff', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'rgba(150,200,255,0.5)', fontSize: '13px', letterSpacing: '1px' }}>Memuat...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!authReady) return (
    <div style={{ ...S.page, justifyContent: 'center' }}>
      <TopBar />
      <LoadingSpinner />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // SPLASH
  // ══════════════════════════════════════════════════════════════════
  if (page === 'splash') return (
    <div style={{ ...S.page, justifyContent: 'center', minHeight: '100vh', padding: '0' }}>
      {/* Background glow effects */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle,rgba(0,100,255,0.15) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle,rgba(0,200,255,0.08) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '40px 24px 120px', boxSizing: 'border-box' }}>
        {/* Logo badge */}
        <div style={{ width: '90px', height: '90px', borderRadius: '24px', background: 'linear-gradient(135deg,#0055cc,#0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', boxShadow: '0 12px 40px rgba(0,130,255,0.5)', marginBottom: '20px' }}>📚</div>
        <p style={{ fontSize: '11px', color: 'rgba(0,200,255,0.7)', letterSpacing: '4px', margin: '0 0 6px', fontWeight: '700' }}>SELAMAT DATANG DI</p>
        <p style={{ fontSize: '36px', fontWeight: '900', color: 'white', margin: '0 0 4px', letterSpacing: '3px', textAlign: 'center' }}>E-JULU</p>
        <p style={{ fontSize: '13px', color: 'rgba(0,200,255,0.8)', letterSpacing: '2px', margin: '0 0 6px', fontWeight: '600' }}>E-LEARNING PLATFORM</p>
        <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg,transparent,#00aaff,transparent)', margin: '10px 0 20px' }} />
        <img src="/logo_sekolah.png" alt="Logo" style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '16px', borderRadius: '50%', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }} />
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#ffd700', textAlign: 'center', margin: '0 0 4px', letterSpacing: '0.5px' }}>SMA NEGERI 1 LUMBANJULU</p>
        <p style={{ fontSize: '12px', color: 'rgba(200,220,255,0.5)', margin: '0 0 40px', letterSpacing: '1px' }}>Kabupaten Toba · Sumatera Utara</p>
        <img src="/robot.png" alt="Robot" style={{ height: '130px', marginBottom: '32px', filter: 'drop-shadow(0 10px 20px rgba(0,150,255,0.4))' }} />
        <button onClick={() => setPage('role')} style={{ ...S.btnOrange, width: '200px', padding: '18px', fontSize: '18px', fontWeight: '900', letterSpacing: '3px', borderRadius: '50px' }}>
          MULAI
        </button>
      </div>
      <Footer />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // MENUNGGU & DITOLAK
  // ══════════════════════════════════════════════════════════════════
  if (page === 'menunggu') return (
    <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
      <TopBar />
      <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(200,130,0,0.2),rgba(150,80,0,0.3))', border: '2px solid rgba(255,180,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '20px', boxShadow: '0 8px 30px rgba(200,130,0,0.2)' }}>⏳</div>
      <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: '900', marginBottom: '8px', letterSpacing: '0.5px' }}>Pendaftaran Terkirim!</p>
      <p style={{ color: 'rgba(200,220,255,0.6)', fontSize: '14px', lineHeight: '1.8', marginBottom: '24px' }}>
        Akunmu sedang menunggu<br />persetujuan admin sekolah.<br />
        Kamu bisa login setelah disetujui.
      </p>
      <div style={{ ...S.card, border: '1px solid rgba(0,200,255,0.2)', textAlign: 'left' }}>
        <p style={{ color: 'rgba(0,200,255,0.8)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
          💡 Hubungi admin sekolah untuk konfirmasi lebih cepat.
        </p>
      </div>
      <button onClick={() => setPage('role')} style={{ ...S.btnOrange, marginTop: '20px' }}>← Kembali ke Beranda</button>
    </div>
  );

  if (page === 'ditolak') return (
    <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
      <TopBar />
      <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(200,30,30,0.2),rgba(140,10,10,0.3))', border: '2px solid rgba(255,80,80,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '20px', boxShadow: '0 8px 30px rgba(200,30,30,0.2)' }}>❌</div>
      <p style={{ color: '#ff6060', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Pendaftaran Ditolak</p>
      <p style={{ color: 'rgba(200,220,255,0.6)', fontSize: '14px', lineHeight: '1.8', marginBottom: '24px' }}>
        Maaf, pendaftaranmu ditolak oleh admin.<br />
        Hubungi admin sekolah untuk info lebih lanjut.
      </p>
      <button onClick={() => setPage('role')} style={S.btnOrange}>← Kembali ke Beranda</button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // PILIH ROLE
  // ══════════════════════════════════════════════════════════════════
  if (page === 'role') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="splash" />
      <p style={{ fontSize: '13px', color: 'rgba(150,210,255,0.6)', textAlign: 'center', marginBottom: '8px', letterSpacing: '2px', fontWeight: '700' }}>MASUK SEBAGAI</p>
      <p style={{ fontSize: '22px', fontWeight: '900', textAlign: 'center', margin: '0 0 28px', color: 'white' }}>Pilih Peranmu</p>
      <div style={{ display: 'flex', gap: '14px', width: '100%', marginBottom: '14px' }}>
        <button onClick={() => setPage('menuGuru')} style={{ ...S.btnBlue, color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 16px', fontSize: '15px', fontWeight: '800' }}>
          <span style={{ fontSize: '32px' }}>👨‍🏫</span>
          <span style={{ color: '#00d4ff' }}>GURU</span>
        </button>
        <button onClick={() => setPage('menuSiswa')} style={{ ...S.btnBlue, color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 16px', fontSize: '15px', fontWeight: '800', border: '1px solid rgba(255,210,0,0.4)', background: 'linear-gradient(160deg,rgba(140,100,0,0.5),rgba(80,50,0,0.8))' }}>
          <span style={{ fontSize: '32px' }}>🎓</span>
          <span style={{ color: '#ffd700' }}>SISWA</span>
        </button>
      </div>
      <button onClick={() => { setAdminEmail(''); setAdminPassword(''); setAdminError(''); setPage('loginAdmin'); }}
        style={{ width: '100%', padding: '13px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'rgba(200,220,255,0.4)', fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginBottom: '32px', letterSpacing: '1px' }}>
        🔐 ADMIN
      </button>
      <img src="/robot.png" alt="Robot" style={{ height: '160px', alignSelf: 'flex-start', filter: 'drop-shadow(0 8px 20px rgba(0,150,255,0.3))' }} />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // LOGIN ADMIN
  // ══════════════════════════════════════════════════════════════════
  if (page === 'loginAdmin') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="role" />
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
      <p style={{ color: '#ffd700', fontSize: '22px', fontWeight: '900', marginBottom: '4px' }}>LOGIN ADMIN</p>
      <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px', marginBottom: '24px' }}>Akses khusus administrator</p>
      {adminError && <div style={S.errBox}>⚠️ {adminError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>Email Admin:</label>
        <input style={S.input} type="email" placeholder="admin@ejulu.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
        <label style={S.label}>Password Admin:</label>
        <div style={S.pwWrap}>
          <input style={{ ...S.input, paddingRight: '40px' }} type={showAdminPassword ? 'text' : 'password'} placeholder="••••••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
          <button style={S.eyeBtn} onClick={() => setShowAdminPassword(!showAdminPassword)}>{showAdminPassword ? '🙈' : '👁️'}</button>
        </div>
        <button style={{ ...S.btnOrange, marginTop: '16px' }} onClick={loginAdmin}>🔐 Masuk sebagai Admin</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD
  // ══════════════════════════════════════════════════════════════════
  if (page === 'adminDashboard') return (
    <div style={S.page}>
      <TopBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
        <p style={{ color: '#ffd700', fontSize: '18px', fontWeight: '900', margin: 0 }}>🛡️ PANEL ADMIN</p>
        <button onClick={() => setPage('role')} style={{ background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>🚪 Keluar</button>
      </div>
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', width: '100%', marginBottom: '16px' }}>
        {[
          { key: 'pending',  label: '⏳ Pending',  warna: '#f39c12' },
          { key: 'all',      label: '👥 Semua',    warna: '#2980b9' },
          { key: 'poin',     label: '🏆 Poin',     warna: '#8e44ad' },
          { key: 'settings', label: '⚙️ Aplikasi', warna: '#1e8449' },
        ].map(t => (
          <button key={t.key} onClick={() => {
            setAdminTab(t.key);
            if (t.key === 'settings') { setPage('adminSettings'); return; }
            loadAdminUsers(t.key === 'poin' ? 'approved' : t.key);
          }} style={{ padding: '10px 4px', borderRadius: '8px', border: 'none', fontSize: '11px', background: adminTab === t.key ? t.warna : 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>
      {adminLoading && <LoadingSpinner />}

      {adminTab === 'pending' && !adminLoading && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>⏳ Menunggu Persetujuan ({adminUsers.length})</p>
          {adminUsers.length === 0 && <div style={{ ...S.card, textAlign: 'center' }}><p style={{ color: 'rgba(160,200,230,0.5)' }}>Tidak ada pendaftaran baru.</p></div>}
          {adminUsers.map((u, i) => (
            <div key={i} style={{ ...S.card, border: '1px solid #f39c12' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '15px' }}>{u.nama}</p>
              <p style={{ color: u.role === 'siswa' ? '#f0e000' : '#4fc3f7', fontSize: '12px', margin: '0 0 2px' }}>
                {u.role === 'siswa' ? `🎓 Siswa — Kelas ${u.kelas}-${u.jurusan}` : `👨‍🏫 Guru — ${u.mapel}`}
              </p>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', margin: '0 0 2px' }}>{u.email}</p>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: '0 0 6px' }}>{u.role === 'siswa' ? `NISN: ${u.nisn} | Agama: ${u.agama}` : `NIP/NIK: ${u.nip || u.nik} | Jabatan: ${u.jabatan}`}</p>
              <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '12px', margin: '0 0 10px' }}>📝 {u.bio}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => approveUser(u.uid)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#1e8449,#145a32)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>✅ Setujui</button>
                <button onClick={() => rejectUser(u.uid)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#c0392b,#922b21)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>❌ Tolak</button>
                <button onClick={() => hapusUser(u.uid)} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', background: '#555', color: 'white', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'all' && !adminLoading && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#00c8ff', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>👥 Semua User ({adminUsers.length})</p>
          {adminUsers.length === 0 && <div style={{ ...S.card, textAlign: 'center' }}><p style={{ color: 'rgba(160,200,230,0.5)' }}>Belum ada user.</p></div>}
          {adminUsers.map((u, i) => (
            <div key={i} style={{ ...S.card, border: `1px solid ${u.status === 'approved' ? '#27ae60' : u.status === 'pending' ? '#f39c12' : '#e74c3c'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '14px' }}>{u.nama}</p>
                  <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', margin: 0 }}>{u.role === 'siswa' ? `🎓 Kelas ${u.kelas}-${u.jurusan}` : `👨‍🏫 ${u.mapel}`}</p>
                  <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: '2px 0 0' }}>{u.email}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: u.status === 'approved' ? '#1e8449' : u.status === 'pending' ? '#b7860b' : '#922b21', color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {u.status === 'approved' ? '✅ Aktif' : u.status === 'pending' ? '⏳ Pending' : '❌ Ditolak'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button onClick={() => { setSelectedUser(u); setEditPoinForm({ poinPG: u.poinPG||0, poinEssay: u.poinEssay||0, poinModul: u.poinModul||0, poinUpload: u.poinUpload||0, poinNilai: u.poinNilai||0, pelanggaran: u.pelanggaran||0 }); setPage('adminDetailUser'); }}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#1565c0', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>👁️ Detail</button>
                <button onClick={() => resetPassword(u.email)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#8e44ad', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🔑 Reset PW</button>
                <button onClick={() => hapusUser(u.uid)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#c0392b', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'poin' && !adminLoading && (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#8e44ad', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>🏆 Edit Poin ({adminUsers.length} user aktif)</p>
          {adminUsers.length === 0 && <div style={{ ...S.card, textAlign: 'center' }}><p style={{ color: 'rgba(160,200,230,0.5)' }}>Belum ada user aktif.</p></div>}
          {adminUsers.map((u, i) => (
            <div key={i} style={{ ...S.card, border: '1px solid #8e44ad', cursor: 'pointer' }}
              onClick={() => { setSelectedUser(u); setEditPoinForm({ poinPG: u.poinPG||0, poinEssay: u.poinEssay||0, poinModul: u.poinModul||0, poinUpload: u.poinUpload||0, poinNilai: u.poinNilai||0, pelanggaran: u.pelanggaran||0 }); setPage('adminDetailUser'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '14px' }}>{u.nama}</p>
                  <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', margin: 0 }}>{u.role === 'siswa' ? `🎓 Kelas ${u.kelas}-${u.jurusan}` : `👨‍🏫 ${u.mapel}`}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
                    {u.role === 'siswa' ? (u.poinPG||0)+(u.poinEssay||0)+(u.poinModul||0) : (u.poinUpload||0)+(u.poinNilai||0)} pts
                  </p>
                  <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: 0 }}>✏️ Klik edit</p>
                </div>
              </div>
            </div>
          ))}
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
      <BackBtn to="adminDashboard" fn={() => { setSelectedUser(null); setPage('adminDashboard'); }} />
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      <div style={{ ...S.card, border: '1px solid #4fc3f7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div style={{ fontSize: '36px' }}>{selectedUser.role === 'siswa' ? '🎓' : '👨‍🏫'}</div>
          <div>
            <p style={{ fontWeight: '900', fontSize: '16px', margin: '0 0 2px' }}>{selectedUser.nama}</p>
            <p style={{ color: '#00c8ff', fontSize: '12px', margin: 0 }}>{selectedUser.role === 'siswa' ? `Siswa — Kelas ${selectedUser.kelas}-${selectedUser.jurusan}` : `Guru — ${selectedUser.mapel}`}</p>
            <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: '2px 0 0' }}>{selectedUser.email}</p>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(200,220,255,0.65)', lineHeight: '1.8' }}>
          {selectedUser.role === 'siswa' ? (
            <><p style={{ margin: 0 }}>NISN: {selectedUser.nisn}</p><p style={{ margin: 0 }}>Lahir: {selectedUser.tglLahir}</p><p style={{ margin: 0 }}>Telp: {selectedUser.telpon}</p><p style={{ margin: 0 }}>Agama: {selectedUser.agama}</p></>
          ) : (
            <><p style={{ margin: 0 }}>NIP: {selectedUser.nip||'-'}</p><p style={{ margin: 0 }}>NIK: {selectedUser.nik||'-'}</p><p style={{ margin: 0 }}>Jabatan: {selectedUser.jabatan}</p></>
          )}
        </div>
      </div>

      <div style={{ ...S.card, border: '1px solid #8e44ad' }}>
        <p style={{ color: '#8e44ad', fontWeight: 'bold', marginBottom: '12px' }}>🏆 Edit Poin</p>
        {selectedUser.role === 'siswa' ? (
          <>
            <label style={S.label}>Poin PG (maks 20)</label>
            <input style={S.input} type="number" value={editPoinForm.poinPG} onChange={e => setEditPoinForm(p => ({ ...p, poinPG: e.target.value }))} />
            <label style={S.label}>Poin Essay (maks 30)</label>
            <input style={S.input} type="number" value={editPoinForm.poinEssay} onChange={e => setEditPoinForm(p => ({ ...p, poinEssay: e.target.value }))} />
            <label style={S.label}>Poin Modul (maks 50)</label>
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
        <button onClick={() => simpanEditPoin(selectedUser.uid)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1e8449,#145a32)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>💾 Simpan Poin</button>
      </div>

      <div style={{ ...S.card, border: '1px solid #6c3483' }}>
        <p style={{ color: '#8e44ad', fontWeight: 'bold', marginBottom: '8px' }}>🔑 Reset Password</p>
        <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', marginBottom: '10px' }}>Email reset dikirim ke: <strong style={{ color: 'white' }}>{selectedUser.email}</strong></p>
        <button onClick={() => resetPassword(selectedUser.email)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6c3483,#4a235a)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>📧 Kirim Email Reset Password</button>
      </div>

      <div style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)' }}>
        <p style={{ color: '#00c8ff', fontWeight: 'bold', marginBottom: '8px' }}>📊 Ubah Status</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => approveUser(selectedUser.uid)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#1e8449', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>✅ Setujui</button>
          <button onClick={() => rejectUser(selectedUser.uid)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#b7860b', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>🚫 Tolak</button>
        </div>
      </div>

      <div style={{ ...S.card, border: '1px solid #e74c3c' }}>
        <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '8px' }}>⚠️ Hapus dari Sistem</p>
        <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', marginBottom: '10px' }}>Tindakan ini tidak bisa dibatalkan!</p>
        <button onClick={() => hapusUser(selectedUser.uid)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#c0392b,#922b21)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>🗑️ Hapus User Ini</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // ADMIN SETTINGS
  // ══════════════════════════════════════════════════════════════════
  if (page === 'adminSettings') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="adminDashboard" fn={() => { setAdminTab('pending'); loadAdminUsers('pending'); setPage('adminDashboard'); }} />
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      <p style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>⚙️ Pengaturan Aplikasi</p>
      <p style={{ color: 'rgba(150,200,255,0.55)', fontSize: '12px', marginBottom: '20px', letterSpacing: '0.8px' }}>Edit tampilan dan info aplikasi</p>
      <div style={{ ...S.card, border: '1px solid #1e8449', width: '100%' }}>
        <p style={{ color: '#00c878', fontWeight: 'bold', marginBottom: '12px' }}>📝 Info Sekolah</p>
        <label style={S.label}>Nama Sekolah</label>
        <input style={S.input} value={appSettings.namaSekolah} onChange={e => setAppSettings(p => ({ ...p, namaSekolah: e.target.value }))} />
        <label style={S.label}>Tagline</label>
        <input style={S.input} value={appSettings.tagline} onChange={e => setAppSettings(p => ({ ...p, tagline: e.target.value }))} />
        <label style={S.label}>Teks Sambutan</label>
        <input style={S.input} value={appSettings.welcomeText} onChange={e => setAppSettings(p => ({ ...p, welcomeText: e.target.value }))} />
        <button onClick={simpanAppSettings} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1e8449,#145a32)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>💾 Simpan Pengaturan</button>
      </div>
      <div style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)' }}>
        <p style={{ color: '#00c8ff', fontWeight: 'bold', marginBottom: '12px' }}>📊 Statistik Aplikasi</p>
        <button onClick={async () => {
          const snap = await getDocs(collection(db, 'users'));
          const users = snap.docs.map(d => d.data());
          const siswa = users.filter(u => u.role === 'siswa' && u.status === 'approved').length;
          const guru = users.filter(u => u.role === 'guru' && u.status === 'approved').length;
          const pending = users.filter(u => u.status === 'pending').length;
          setAdminMsg(`📊 Siswa Aktif: ${siswa} | Guru Aktif: ${guru} | Pending: ${pending}`);
          setTimeout(() => setAdminMsg(''), 5000);
        }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1565c0,#0d47a1)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
          📊 Lihat Statistik
        </button>
      </div>
      <div style={{ ...S.card, border: '1px solid rgba(255,180,0,0.2)' }}>
        <p style={{ color: '#ffd700', fontWeight: '700', marginBottom: '8px', fontSize: '14px' }}>🏫 Halaman Tentang Sekolah</p>
        <p style={{ color: 'rgba(180,200,255,0.45)', fontSize: '12px', marginBottom: '12px' }}>Edit foto sekolah, visi misi, dan info kepsek</p>
        <button onClick={() => { loadAbout(); setPage('adminEditAbout'); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,rgba(140,90,0,0.7),rgba(90,50,0,0.9))', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          ✏️ Edit Halaman Tentang
        </button>
      </div>
      <div style={{ ...S.card, border: '1px solid #f39c12' }}>
        <p style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '8px' }}>🔐 Info Kredensial Admin</p>
        <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '13px', margin: '0 0 4px' }}>Email: <strong style={{ color: 'white' }}>{ADMIN_EMAIL}</strong></p>
        <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: 0 }}>Password tersimpan di kode aplikasi</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // MENU SISWA & GURU
  // ══════════════════════════════════════════════════════════════════
  if (page === 'menuSiswa') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="role" />
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(200,130,0,0.4),rgba(150,80,0,0.6))', border: '2px solid rgba(255,210,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(200,130,0,0.2)' }}>🎓</div>
      <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: '900', textAlign: 'center', letterSpacing: '1px', margin: '0 0 4px' }}>AKSES SISWA</p>
      <p style={{ color: 'rgba(200,200,200,0.5)', fontSize: '12px', marginBottom: '32px', letterSpacing: '1px' }}>SMA Negeri 1 Lumbanjulu</p>
      <img src="/logo_sekolah.png" alt="Logo" style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '32px', borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
      <button style={S.btnTeal} onClick={() => { setLoginError(''); setPage('loginSiswa'); }}>
        <span style={{ fontSize: '24px' }}>👤</span><span>LOGIN SISWA</span>
      </button>
      <button style={S.btnGold} onClick={() => setPage('registerSiswa')}>
        <span style={{ fontSize: '24px' }}>📝</span><span>DAFTAR SISWA BARU</span>
      </button>
    </div>
  );

  if (page === 'menuGuru') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="role" />
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,100,200,0.4),rgba(0,50,140,0.6))', border: '2px solid rgba(0,200,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '14px', boxShadow: '0 8px 24px rgba(0,100,200,0.2)' }}>👨‍🏫</div>
      <p style={{ color: '#00d4ff', fontSize: '20px', fontWeight: '900', textAlign: 'center', letterSpacing: '1px', margin: '0 0 4px' }}>AKSES GURU</p>
      <p style={{ color: 'rgba(200,200,200,0.5)', fontSize: '12px', marginBottom: '32px', letterSpacing: '1px' }}>SMA Negeri 1 Lumbanjulu</p>
      <img src="/logo_sekolah.png" alt="Logo" style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '32px', borderRadius: '50%', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
      <button style={S.btnTeal} onClick={() => { setLoginError(''); setPage('loginGuru'); }}>
        <span style={{ fontSize: '24px' }}>👨‍🏫</span><span>LOGIN GURU</span>
      </button>
      <button style={S.btnGold} onClick={() => setPage('registerGuru')}>
        <span style={{ fontSize: '24px' }}>📝</span><span>DAFTAR GURU BARU</span>
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // LOGIN SISWA & GURU
  // ══════════════════════════════════════════════════════════════════
  if (page === 'loginSiswa') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuSiswa" />
      <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(200,130,0,0.3),rgba(150,80,0,0.5))', border: '1.5px solid rgba(255,210,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', marginBottom: '14px' }}>🎓</div>
      <p style={{ color: '#ffd700', fontSize: '22px', fontWeight: '900', marginBottom: '4px', letterSpacing: '1px' }}>LOGIN SISWA</p>
      <p style={{ color: 'rgba(180,200,255,0.5)', fontSize: '12px', textAlign: 'center', marginBottom: '28px', letterSpacing: '1px' }}>
        Masuk dengan NISN kamu
      </p>
      {loginError && <div style={S.errBox}>⚠️ {loginError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NISN:</label>
        <input style={S.input} type="text" placeholder="Masukkan NISN"
          value={siswaLoginNISN} onChange={e => setSiswaLoginNISN(e.target.value)} />
        <label style={S.label}>Password:</label>
        <PwInput placeholder="••••••••" val={siswaLoginPassword}
          setVal={setSiswaLoginPassword} show={showLoginPassword} setShow={setShowLoginPassword} />
        <p style={{ color: '#00c8ff', fontSize: '12px', textAlign: 'right', marginBottom: '8px', cursor: 'pointer' }}>
          Lupa Password?
        </p>
        <div style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.25)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ color: '#f0c040', fontSize: '12px', margin: 0 }}>⚠️ Akun harus sudah disetujui admin untuk bisa login.</p>
        </div>
        <button style={{ ...S.btnGold, borderRadius: '30px', justifyContent: 'center', fontSize: '17px' }}
          onClick={loginSiswa} disabled={loading}>
          {loading ? '⏳ Memproses...' : '→ Masuk'}
        </button>
      </div>
    </div>
  );

  if (page === 'loginGuru') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuGuru" />
      <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,100,200,0.3),rgba(0,50,140,0.5))', border: '1.5px solid rgba(0,200,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', marginBottom: '14px' }}>👨‍🏫</div>
      <p style={{ color: '#00d4ff', fontSize: '22px', fontWeight: '900', marginBottom: '4px', letterSpacing: '1px' }}>LOGIN GURU</p>
      <p style={{ color: 'rgba(180,200,255,0.5)', fontSize: '12px', textAlign: 'center', marginBottom: '28px', letterSpacing: '1px' }}>
        Masuk dengan NIP atau NIK kamu
      </p>
      {loginError && <div style={S.errBox}>⚠️ {loginError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NIP / NIK:</label>
        <input style={S.input} type="text" placeholder="Masukkan NIP atau NIK"
          value={guruLoginNIP} onChange={e => setGuruLoginNIP(e.target.value)} />
        <label style={S.label}>Password:</label>
        <PwInput placeholder="••••••••" val={guruLoginPassword}
          setVal={setGuruLoginPassword} show={showLoginPassword} setShow={setShowLoginPassword} />
        <p style={{ color: '#00c8ff', fontSize: '12px', textAlign: 'right', marginBottom: '8px', cursor: 'pointer' }}>
          Lupa Password?
        </p>
        <div style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.25)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ color: '#f0c040', fontSize: '12px', margin: 0 }}>⚠️ Akun harus sudah disetujui admin untuk bisa login.</p>
        </div>
        <button style={{ ...S.btnGold, borderRadius: '30px', justifyContent: 'center', fontSize: '17px' }}
          onClick={loginGuru} disabled={loading}>
          {loading ? '⏳ Memproses...' : '→ Masuk'}
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════════
  if (page === 'dashboard') return (
    <div style={S.page}>
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '430px', height: '180px', background: 'radial-gradient(ellipse at top,rgba(0,80,200,0.12) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <TopBar />
        <div style={{ width: '100%', background: 'linear-gradient(135deg,rgba(0,60,150,0.5),rgba(0,30,80,0.7))', border: '1px solid rgba(0,200,255,0.2)', borderRadius: '20px', padding: '16px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#0066ff,#00aaff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 14px rgba(0,130,255,0.4)', flexShrink: 0 }}>
              {userRole === 'guru' ? '👨‍🏫' : '🎓'}
            </div>
            <div>
              <p style={{ color: 'rgba(130,200,255,0.7)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', margin: '0 0 2px', textTransform: 'uppercase' }}>{userRole === 'guru' ? 'Guru' : `Kelas ${userData?.kelas}${userData?.jurusan}`}</p>
              <p style={{ color: 'white', fontSize: '14px', fontWeight: '800', margin: 0 }}>{userData?.nama}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div onClick={() => { setEditBioForm({ bio: userData?.bio||'', citaCita: userData?.citaCita||'', hobby: userData?.hobby||'' }); setSelectedAvatar(userData?.avatar||''); setPengaturanMsg(''); setPage('pengaturan'); }} style={{ textAlign: 'center', cursor: 'pointer', padding: '6px 8px', borderRadius: '10px', background: 'rgba(0,200,255,0.08)' }}>
              <div style={{ fontSize: '16px' }}>⚙️</div>
              <div style={{ fontSize: '8px', color: 'rgba(130,200,255,0.5)' }}>Setelan</div>
            </div>
            <div onClick={() => { loadAbout(); setPage('about'); }} style={{ textAlign: 'center', cursor: 'pointer', padding: '6px 8px', borderRadius: '10px', background: 'rgba(0,200,255,0.08)' }}>
              <div style={{ fontSize: '16px' }}>ℹ️</div>
              <div style={{ fontSize: '8px', color: 'rgba(130,200,255,0.5)' }}>Tentang</div>
            </div>
          </div>
        </div>
        {userRole === 'siswa' && (
          <div style={{ width: '100%', background: 'linear-gradient(135deg,rgba(0,160,90,0.15),rgba(0,100,60,0.25))', border: '1px solid rgba(0,200,120,0.2)', borderRadius: '16px', padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(0,210,120,0.75)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', margin: '0 0 3px', textTransform: 'uppercase' }}>Total Poin Kamu</p>
              <p style={{ color: 'white', fontSize: '26px', fontWeight: '900', margin: 0, lineHeight: 1 }}>
                {(userData?.poinPG || 0) + (userData?.poinEssay || 0) + (userData?.poinModul || 0)}
                <span style={{ fontSize: '12px', color: 'rgba(0,210,120,0.6)', fontWeight: '600', marginLeft: '4px' }}>poin</span>
              </p>
            </div>
            <div style={{ fontSize: '32px' }}>🏆</div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: '14px' }}>
          {[
            { label: 'Forum Belajar', icon: '💬', grad: 'linear-gradient(135deg,rgba(108,52,131,0.65),rgba(60,10,90,0.9))', glow: 'rgba(108,52,131,0.25)', to: 'forum' },
            { label: 'Daftar Siswa',  icon: '👥', grad: 'linear-gradient(135deg,rgba(26,100,180,0.65),rgba(10,55,130,0.9))', glow: 'rgba(26,100,180,0.25)', to: '' },
            { label: 'Daftar Guru',   icon: '👨‍🏫', grad: 'linear-gradient(135deg,rgba(170,40,40,0.65),rgba(110,10,10,0.9))', glow: 'rgba(170,40,40,0.25)', to: '' },
            { label: 'Perpustakaan', icon: '📚', grad: 'linear-gradient(135deg,rgba(20,110,55,0.65),rgba(5,70,25,0.9))', glow: 'rgba(20,110,55,0.25)', to: '' },
            { label: 'Ujian Sekolah', icon: '📋', grad: 'linear-gradient(135deg,rgba(130,25,25,0.65),rgba(80,5,5,0.9))', glow: 'rgba(130,25,25,0.25)', to: '' },
            { label: 'Pesan',         icon: '💬', grad: 'linear-gradient(135deg,rgba(20,90,140,0.65),rgba(5,50,100,0.9))', glow: 'rgba(20,90,140,0.25)', to: '' },
          ].map((m, i) => (
            <button key={i} onClick={() => { if (m.to) setPage(m.to); }}
              style={{ padding: '18px 14px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.07)', background: m.grad, color: 'white', fontWeight: '700', fontSize: '13px', cursor: m.to ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', boxShadow: `0 6px 20px ${m.glow}`, backdropFilter: 'blur(8px)', opacity: m.to ? 1 : 0.6, textAlign: 'left' }}>
              <span style={{ fontSize: '24px' }}>{m.icon}</span>
              <span style={{ lineHeight: '1.2' }}>{m.label}</span>
            </button>
          ))}
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '12px', background: 'rgba(255,50,50,0.07)', border: '1px solid rgba(255,70,70,0.18)', color: 'rgba(255,110,110,0.75)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
          🚪 Keluar / Logout
        </button>
      </div>
    </div>
  );


  // ══════════════════════════════════════════════════════════════════
  // FORUM — PILIH MAPEL
  // ══════════════════════════════════════════════════════════════════
  if (page === 'forum') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>Forum Belajar Online</p>
      <p style={{ color: 'rgba(150,200,255,0.55)', fontSize: '12px', marginBottom: '20px', letterSpacing: '0.8px' }}>Pilih Mata Pelajaran</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
        {mapelList.map(m => {
          const bisaAkses = userRole === 'siswa' || userData?.mapel === m.nama;
          return (
            <button key={m.id}
              onClick={() => {
                if (!bisaAkses) { alert(`Kamu hanya bisa mengakses ${userData?.mapel}`); return; }
                setSelectedMapel(m);
                if (userRole === 'siswa') {
                  // Siswa langsung ke bab sesuai kelasnya sendiri
                  loadBab(m.nama);
                  setSelectedKelas({ tingkat: userData.kelas, jurusan: userData.jurusan });
                  setPage('forumBab');
                } else {
                  // Guru pilih kelas dulu
                  setGuruPilihTingkat(null);
                  setPage('forumPilihKelas');
                }
              }}
              style={{
                padding: '16px 10px', borderRadius: '14px', border: 'none',
                background: bisaAkses
                  ? `linear-gradient(135deg,${m.warna},${m.warna}99)`
                  : 'rgba(255,255,255,0.05)',
                color: bisaAkses ? 'white' : '#555',
                fontWeight: 'bold', fontSize: '14px', cursor: bisaAkses ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                boxShadow: bisaAkses ? `0 4px 12px ${m.warna}44` : 'none',
                opacity: bisaAkses ? 1 : 0.4,
              }}>
              <span style={{ fontSize: '28px' }}>{m.icon}</span>
              <span style={{ textAlign: 'center', lineHeight: '1.3' }}>{m.nama}</span>
              {!bisaAkses && <span style={{ fontSize: '11px' }}>🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // FORUM — PILIH KELAS (khusus guru)
  // ══════════════════════════════════════════════════════════════════
  if (page === 'forumPilihKelas') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forum" />
      <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>
        {selectedMapel?.icon} {selectedMapel?.nama}
      </p>
      <p style={{ color: 'rgba(150,200,255,0.55)', fontSize: '12px', marginBottom: '20px', letterSpacing: '0.8px' }}>Pilih Kelas</p>

      {/* Pilih Tingkat dulu */}
      {!guruPilihTingkat ? (
        <div style={{ width: '100%' }}>
          <p style={{ color: '#00c8ff', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>📚 Pilih Tingkat Kelas:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['10', '11', '12'].map(tingkat => (
              <button key={tingkat} onClick={() => setGuruPilihTingkat(tingkat)}
                style={{ width: '100%', padding: '20px', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg,${selectedMapel?.warna},${selectedMapel?.warna}99)`, color: 'white', fontWeight: '900', fontSize: '22px', cursor: 'pointer', boxShadow: `0 4px 15px ${selectedMapel?.warna}44` }}>
                Kelas {tingkat}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <button onClick={() => setGuruPilihTingkat(null)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #4fc3f7', color: '#00c8ff', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}>
              ← Kelas {guruPilihTingkat}
            </button>
            <p style={{ color: '#00c8ff', fontWeight: 'bold', fontSize: '15px', margin: 0 }}>Pilih Jurusan:</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', width: '100%' }}>
            {['A','B','C','D','E','F','G','H','I','J'].map(j => (
              <button key={j} onClick={() => {
                  const kelas = { tingkat: guruPilihTingkat, jurusan: j };
                  setSelectedKelas(kelas);
                  loadBab(selectedMapel.nama);
                  setPage('forumBab');
                }}
                style={{ padding: '16px 8px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${selectedMapel?.warna},${selectedMapel?.warna}99)`, color: 'white', fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: `0 4px 12px ${selectedMapel?.warna}44` }}>
                {guruPilihTingkat}{j}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // FORUM — DAFTAR BAB
  // ══════════════════════════════════════════════════════════════════
  if (page === 'forumBab') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to={userRole === 'guru' ? 'forumPilihKelas' : 'forum'} />
      <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>
        {selectedMapel?.icon} {selectedMapel?.nama}
      </p>
      <p style={{ color: '#00c8ff', fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>
        📚 Kelas {selectedKelas?.tingkat}{selectedKelas?.jurusan}
      </p>
      <p style={{ color: 'rgba(150,200,255,0.55)', fontSize: '12px', marginBottom: '20px', letterSpacing: '0.8px' }}>Pilih Bab Pembelajaran</p>
      <div style={{ width: '100%' }}>
        {babList.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', border: '1px solid rgba(0,180,255,0.15)' }}>
            <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '14px' }}>
              {userRole === 'guru' ? 'Belum ada bab. Tambahkan bab baru di bawah.' : 'Belum ada materi. Tunggu guru menambahkan bab.'}
            </p>
          </div>
        )}
        {babList.map(b => (
          <div key={b.id} style={{ marginBottom: '12px' }}>
            {editBab === b.id
              ? <div style={{ ...S.card, border: '1px solid #f0a500' }}>
                  <input style={S.input} value={b.judul}
                    onChange={e => setBabList(prev => prev.map(x => x.id === b.id ? { ...x, judul: e.target.value } : x))} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => simpanJudulBab(b.id, b.judul)}
                      style={{ flex: 1, background: '#1e8449', border: 'none', color: 'white', borderRadius: '8px', padding: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      💾 Simpan
                    </button>
                    <button onClick={() => hapusBab(b.id)}
                      style={{ background: '#c0392b', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              : <button onClick={() => {
                    setSelectedBab(b);
                    setLinkEdit({ modul: b.modul, modul2: b.modul2, video: b.video });
                    loadSoal(b.id);
                    setPage('forumIsiBab');
                  }}
                  style={{
                    width: '100%', padding: '16px 20px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg,#1a3a5c,#1e5799)',
                    color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                  <span>📖 {b.judul}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {userRole === 'guru' && (
                      <span onClick={e => { e.stopPropagation(); setEditBab(b.id); }}
                        style={{ fontSize: '16px', cursor: 'pointer' }}>✏️</span>
                    )}
                    <span style={{ color: '#00c8ff', fontSize: '20px' }}>›</span>
                  </div>
                </button>
            }
          </div>
        ))}

        {userRole === 'guru' && (
          <div style={{ ...S.card, border: '1px solid rgba(0,200,120,0.3)', marginTop: '8px' }}>
            <p style={{ color: '#00c878', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>+ Tambah Bab Baru</p>
            <input style={S.input} placeholder="Contoh: Bab 4 - Persamaan Linear"
              value={babBaru} onChange={e => setBabBaru(e.target.value)} />
            <button onClick={tambahBab}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#1e8449', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              ✅ Tambah Bab
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // FORUM — ISI BAB
  // ══════════════════════════════════════════════════════════════════
  if (page === 'forumIsiBab') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumBab" fn={() => { stopTimerModul(); stopTimerVideo(); setPage('forumBab'); }} />
      <p style={{ color: '#ffd700', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>{selectedBab?.judul}</p>
      <p style={{ color: '#00c8ff', fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>
        {selectedMapel?.nama} — Kelas {selectedKelas?.tingkat}{selectedKelas?.jurusan}
      </p>

      {userRole === 'siswa' && (
        <div style={{ ...S.card, border: '1px solid rgba(0,200,120,0.3)', marginBottom: '16px' }}>
          <p style={{ color: '#00c878', fontWeight: 'bold', fontSize: '13px', margin: 0 }}>
            📊 Poin Modul: {hitungPoinModul()}/50 pts &nbsp;|&nbsp;
            📖 {modulDurasi} mnt &nbsp;|&nbsp; 🎥 {videoDurasi} mnt
          </p>
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Modul 1 */}
        <div style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)' }}>
          <p style={{ color: '#00c8ff', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>📄 Modul Pembelajaran</p>
          {userRole === 'siswa'
            ? selectedBab?.modul
              ? <a href={selectedBab.modul} target="_blank" rel="noreferrer"
                  onClick={() => { if (!modulTimerRef.current) mulaiTimerModul(); }}
                  style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#1565c0,#0d47a1)' }}>
                  <span style={{ fontSize: '20px' }}>📂</span> Buka Modul
                </a>
              : <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px' }}>Belum ada modul dari guru.</p>
            : <div>
                <input style={S.input} placeholder="Link modul (Google Drive / PDF)..."
                  value={linkEdit.modul} onChange={e => setLinkEdit(p => ({ ...p, modul: e.target.value }))} />
                <button onClick={() => simpanLinkBab('modul')}
                  style={{ background: '#1e8449', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  💾 Simpan Link
                </button>
              </div>
          }
        </div>

        {/* Modul 2 */}
        <div style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)' }}>
          <p style={{ color: '#00c8ff', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>📄 Modul Pembelajaran Lainnya</p>
          {userRole === 'siswa'
            ? selectedBab?.modul2
              ? <a href={selectedBab.modul2} target="_blank" rel="noreferrer"
                  onClick={() => { if (!modulTimerRef.current) mulaiTimerModul(); }}
                  style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#1565c0,#0d47a1)' }}>
                  <span style={{ fontSize: '20px' }}>📂</span> Buka Modul Lainnya
                </a>
              : <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px' }}>Belum ada modul dari guru.</p>
            : <div>
                <input style={S.input} placeholder="Link modul lainnya..."
                  value={linkEdit.modul2} onChange={e => setLinkEdit(p => ({ ...p, modul2: e.target.value }))} />
                <button onClick={() => simpanLinkBab('modul2')}
                  style={{ background: '#1e8449', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  💾 Simpan Link
                </button>
              </div>
          }
        </div>

        {/* Video */}
        <div style={{ ...S.card, border: '1px solid #e74c3c' }}>
          <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>🎥 Video Pembelajaran</p>
          {userRole === 'siswa'
            ? selectedBab?.video
              ? <a href={selectedBab.video} target="_blank" rel="noreferrer"
                  onClick={() => { if (!videoTimerRef.current) mulaiTimerVideo(); }}
                  style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#c0392b,#922b21)' }}>
                  <span style={{ fontSize: '20px' }}>▶️</span> Tonton Video YouTube
                </a>
              : <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px' }}>Belum ada video dari guru.</p>
            : <div>
                <input style={S.input} placeholder="Link YouTube..."
                  value={linkEdit.video} onChange={e => setLinkEdit(p => ({ ...p, video: e.target.value }))} />
                <button onClick={() => simpanLinkBab('video')}
                  style={{ background: '#1e8449', border: 'none', color: 'white', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  💾 Simpan Link
                </button>
              </div>
          }
        </div>

        {/* Quiz */}
        <div style={{ ...S.card, border: '1px solid #f39c12' }}>
          <p style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '12px', fontSize: '15px' }}>📝 Quiz Pembelajaran</p>
          {userRole === 'siswa'
            ? quizSoalList.length > 0
              ? <button onClick={() => {
                    hasilTersimpan.current = false; // reset flag sebelum quiz baru
                    const acak = acakSoal(quizSoalList);
                    setQuizSoalAcak(acak);
                    setQuizSoalIndex(0);
                    setQuizJawaban({});
                    setQuizSelesai(false);
                    setTimer(20);
                    setPage('quiz');
                  }} style={{ ...S.btnOrange, marginTop: '0' }}>
                  🚀 Mulai Quiz
                </button>
              : <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px' }}>Belum ada soal dari guru.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setPage('guruBuatQuiz')}
                  style={{ background: '#8e44ad', border: 'none', color: 'white', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  ✏️ Buat / Edit Soal Quiz
                </button>
                <button onClick={() => { loadHasilSiswa(selectedBab.id, `${selectedKelas?.tingkat}${selectedKelas?.jurusan}`); setPage('guruKelola'); }}
                  style={{ background: '#1a5276', border: 'none', color: 'white', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  📊 Lihat Hasil Siswa
                </button>
              </div>
          }
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // QUIZ SISWA
  // ══════════════════════════════════════════════════════════════════
  if (page === 'quiz') {
    const pgSoal = quizSoalAcak.filter(s => s.tipe === 'pg');
    const essaySoal = quizSoalAcak.filter(s => s.tipe === 'essay');

    // FIX 7: Halaman hasil quiz — tidak lagi memanggil simpanHasilQuiz() di sini
    if (quizSelesai) {
      const poinPG = hitungPoinPG();
      return (
        <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
          <TopBar />
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
          <p style={{ color: '#ffd700', fontSize: '22px', fontWeight: '900', marginBottom: '16px' }}>Quiz Selesai!</p>
          <div style={{ ...S.card, border: '1px solid rgba(0,200,120,0.3)', textAlign: 'left', marginBottom: '16px' }}>
            <p style={{ color: '#00d278', fontWeight: 'bold', marginBottom: '8px' }}>📊 Hasil Quiz Kamu:</p>
            <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '14px', margin: '4px 0' }}>
              ✅ Pilihan Ganda: <strong style={{ color: 'white' }}>{poinPG}/20 pts</strong>
            </p>
            <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '14px', margin: '4px 0' }}>
              ✍️ Essay: <strong style={{ color: '#f39c12' }}>Menunggu penilaian guru (maks 30 pts)</strong>
            </p>
            <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '14px', margin: '4px 0' }}>
              📖 Modul + Video: <strong style={{ color: 'white' }}>{hitungPoinModul()}/50 pts</strong>
            </p>
          </div>
          <button onClick={() => setPage('forumIsiBab')} style={S.btnOrange}>← Kembali ke Bab</button>
        </div>
      );
    }

    if (quizSoalIndex < pgSoal.length) {
      const soal = pgSoal[quizSoalIndex];
      const persen = (timer / 20) * 100;
      const warnaTimer = timer > 10 ? '#2ecc71' : timer > 5 ? '#f39c12' : '#e74c3c';
      return (
        <div style={{ ...S.page, userSelect: 'none', WebkitUserSelect: 'none' }}
          onContextMenu={e => e.preventDefault()}>
          <TopBar />
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px' }}>PG {quizSoalIndex + 1}/{pgSoal.length}</span>
              <span style={{ color: warnaTimer, fontSize: '15px', fontWeight: 'bold' }}>⏱️ {timer}s</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
              <div style={{ height: '6px', background: '#f0a500', borderRadius: '3px', width: `${((quizSoalIndex + 1) / pgSoal.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px' }}>
              <div style={{ height: '4px', background: warnaTimer, borderRadius: '3px', width: `${persen}%`, transition: 'width 1s linear' }} />
            </div>
          </div>
          <div style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.6', margin: 0 }}>📌 {soal.soal}</p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {soal.opsi.map((op, i) => (
              <button key={i}
                onClick={() => setQuizJawaban(prev => ({ ...prev, [soal.id]: op[0] }))}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '10px',
                  border: quizJawaban[soal.id] === op[0] ? '2px solid #f0a500' : '1px solid #2a5f7a',
                  background: quizJawaban[soal.id] === op[0] ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.05)',
                  color: 'white', fontSize: '15px', cursor: 'pointer', textAlign: 'left',
                }}>
                {op}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
            {quizSoalIndex < pgSoal.length - 1
              ? <button onClick={() => handleNextSoal()}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1565c0,#0d47a1)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  Selanjutnya →
                </button>
              : <button onClick={() => { clearInterval(timerRef.current); setQuizSoalIndex(pgSoal.length); }}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#1e8449,#145a32)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  Lanjut ke Essay →
                </button>
            }
          </div>
        </div>
      );
    }

    const essayIndex = quizSoalIndex - pgSoal.length;
    if (essayIndex < essaySoal.length) {
      const soal = essaySoal[essayIndex];
      return (
        <div style={{ ...S.page, userSelect: 'none', WebkitUserSelect: 'none' }}
          onContextMenu={e => e.preventDefault()}>
          <TopBar />
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px' }}>Essay {essayIndex + 1}/{essaySoal.length}</span>
              <span style={{ color: '#f39c12', fontSize: '13px', fontWeight: 'bold' }}>✍️ Tidak ada timer</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
              <div style={{ height: '6px', background: '#f39c12', borderRadius: '3px', width: `${((essayIndex + 1) / essaySoal.length) * 100}%` }} />
            </div>
          </div>
          <div style={{ ...S.card, border: '1px solid #f39c12', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.6', margin: 0 }}>✍️ {soal.soal}</p>
          </div>
          <textarea style={{ ...S.input, height: '150px', resize: 'none' }}
            placeholder="Tulis jawaban essay kamu di sini..."
            value={quizJawaban[soal.id] || ''}
            onChange={e => setQuizJawaban(prev => ({ ...prev, [soal.id]: e.target.value }))}
          />
          <button onClick={() => {
            if (essayIndex < essaySoal.length - 1) setQuizSoalIndex(i => i + 1);
            else setQuizSelesai(true);
          }} style={{ ...S.btnOrange, marginTop: '16px' }}>
            {essayIndex < essaySoal.length - 1 ? 'Selanjutnya →' : '✅ Selesai & Kirim'}
          </button>
        </div>
      );
    }

    // FIX 8: Fallback jika quiz hanya PG tanpa essay dan sudah selesai semua
    return (
      <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
        <TopBar />
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
        <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: '900' }}>Semua soal selesai!</p>
        <button onClick={() => setQuizSelesai(true)} style={{ ...S.btnOrange, marginTop: '16px' }}>
          Lihat Hasil →
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // GURU — BUAT QUIZ
  // ══════════════════════════════════════════════════════════════════
  if (page === 'guruBuatQuiz') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumIsiBab" />
      <p style={{ color: '#ffd700', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>Buat / Edit Soal Quiz</p>
      <p style={{ color: 'rgba(150,200,255,0.55)', fontSize: '12px', marginBottom: '20px', letterSpacing: '0.8px' }}>{selectedMapel?.nama} — {selectedBab?.judul}</p>

      {quizSoalList.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', border: '1px solid rgba(0,180,255,0.15)' }}>
          <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '14px' }}>Belum ada soal. Tambahkan di bawah.</p>
        </div>
      )}

      {quizSoalList.map((q, i) => (
        <div key={q.id} style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#00c8ff', fontWeight: 'bold', fontSize: '14px' }}>
              Soal {i + 1} — {q.tipe === 'pg' ? 'Pilihan Ganda' : 'Essay'}
            </span>
            <button onClick={() => hapusSoal(q.id)}
              style={{ background: '#c0392b', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>
              🗑️
            </button>
          </div>
          <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '14px', lineHeight: '1.5' }}>{q.soal}</p>
          {q.tipe === 'pg' && (
            <div>
              {q.opsi.map((op, j) => (
                <p key={j} style={{ color: op[0] === q.kunci ? '#2ecc71' : '#aaa', fontSize: '13px', margin: '2px 0' }}>
                  {op[0] === q.kunci ? '✅ ' : ''}{op}
                </p>
              ))}
              <p style={{ color: '#ffd700', fontSize: '12px', marginTop: '4px' }}>Kunci: {q.kunci}</p>
            </div>
          )}
        </div>
      ))}

      <div style={{ ...S.card, border: '2px dashed #8e44ad', marginTop: '8px' }}>
        <p style={{ color: '#8e44ad', fontWeight: 'bold', marginBottom: '10px' }}>+ Tambah Pilihan Ganda</p>
        <textarea style={{ ...S.input, height: '70px', resize: 'none' }}
          placeholder="Tulis pertanyaan..."
          value={soalBaru.soal} onChange={e => setSoalBaru(p => ({ ...p, soal: e.target.value }))} />
        {soalBaru.opsi.map((op, j) => (
          <input key={j} style={{ ...S.input, marginBottom: '6px' }} value={op}
            onChange={e => setSoalBaru(p => ({ ...p, opsi: p.opsi.map((o, k) => k === j ? e.target.value : o) }))} />
        ))}
        <label style={S.label}>Kunci Jawaban:</label>
        <select style={S.select} value={soalBaru.kunci}
          onChange={e => setSoalBaru(p => ({ ...p, kunci: e.target.value }))}>
          {['A', 'B', 'C', 'D', 'E'].map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <button onClick={tambahSoalPG}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#8e44ad', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
          ✅ Simpan Soal PG
        </button>
      </div>

      <div style={{ ...S.card, border: '2px dashed #f39c12', marginTop: '12px' }}>
        <p style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>+ Tambah Essay</p>
        <textarea style={{ ...S.input, height: '80px', resize: 'none' }}
          placeholder="Tulis soal essay..."
          value={essayBaru} onChange={e => setEssayBaru(e.target.value)} />
        <button onClick={tambahSoalEssay}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#f39c12', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
          ✅ Simpan Soal Essay
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // GURU — LIHAT HASIL SISWA
  // ══════════════════════════════════════════════════════════════════
  if (page === 'guruKelola') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumIsiBab" />
      <p style={{ color: '#ffd700', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>Hasil Siswa</p>
      <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px', marginBottom: '16px' }}>
        {selectedMapel?.nama} — {selectedBab?.judul} — Kelas {selectedKelas?.tingkat}{selectedKelas?.jurusan}
      </p>

      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '16px' }}>
        {[
          { key: 'pg',    label: '📝 Skor PG' },
          { key: 'essay', label: '✍️ Essay' },
          { key: 'modul', label: '📖 Aktivitas' },
        ].map(t => (
          <button key={t.key} onClick={() => setLihatTab(t.key)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none', fontSize: '12px',
              background: lihatTab === t.key ? '#1565c0' : 'rgba(255,255,255,0.08)',
              color: lihatTab === t.key ? 'white' : '#aaa',
              fontWeight: lihatTab === t.key ? 'bold' : 'normal', cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {hasilSiswa.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', border: '1px solid rgba(0,180,255,0.15)' }}>
          <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '14px' }}>Belum ada siswa yang mengerjakan quiz.</p>
        </div>
      )}

      {lihatTab === 'pg' && hasilSiswa.map((s, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '15px' }}>{s.siswaNama}</p>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', margin: 0 }}>Kelas {s.siswaKelas}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#00d278', fontWeight: 'bold', margin: 0 }}>{s.poinPG}/20 pts</p>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: 0 }}>{s.poinPG >= 12 ? '✅ Lulus' : '❌ Remedial'}</p>
            </div>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '10px' }}>
            <div style={{ height: '6px', background: s.poinPG >= 12 ? '#2ecc71' : '#e74c3c', borderRadius: '3px', width: `${(s.poinPG / 20) * 100}%` }} />
          </div>
        </div>
      ))}

      {lihatTab === 'essay' && hasilSiswa.map((s, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid #f39c12' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px', fontSize: '15px' }}>{s.siswaNama}</p>
          <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', margin: '0 0 10px' }}>Kelas {s.siswaKelas}</p>
          {s.essayJawaban?.map((ej, j) => (
            <div key={j} style={{ marginBottom: '10px' }}>
              <p style={{ color: '#f39c12', fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px' }}>Soal: {ej.soal}</p>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
                <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                  {ej.jawaban || <span style={{ color: '#555' }}>Tidak dijawab</span>}
                </p>
              </div>
            </div>
          ))}
          {s.nilaiEssay !== null && s.nilaiEssay !== undefined
            ? <p style={{ color: '#00d278', fontWeight: 'bold', fontSize: '14px' }}>✅ Nilai Essay: {s.nilaiEssay}/100</p>
            : <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input style={{ ...S.input, marginBottom: '0', flex: 1 }}
                  type="number" placeholder="Nilai 0-100" min="0" max="100"
                  value={nilaiEssayInput[i] || ''}
                  onChange={e => setNilaiEssayInput(p => ({ ...p, [i]: e.target.value }))} />
                <button onClick={() => simpanNilaiEssay(s.id, nilaiEssayInput[i], i)}
                  style={{ background: '#1e8449', border: 'none', color: 'white', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  💾 Simpan
                </button>
              </div>
          }
        </div>
      ))}

      {lihatTab === 'modul' && hasilSiswa.map((s, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid rgba(0,180,255,0.15)' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px', fontSize: '15px' }}>{s.siswaNama}</p>
          <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '12px', margin: '0 0 10px' }}>Kelas {s.siswaKelas}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ color: '#00c8ff', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{s.modulDurasi} mnt</p>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: 0 }}>Baca Modul</p>
              <p style={{ color: s.modulDurasi >= 120 ? '#2ecc71' : '#e74c3c', fontSize: '11px', margin: 0 }}>
                {s.modulDurasi >= 120 ? '✅ Tercapai' : '❌ Kurang 2 jam'}
              </p>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ color: '#e74c3c', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{s.videoDurasi} mnt</p>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '11px', margin: 0 }}>Tonton Video</p>
              <p style={{ color: s.videoDurasi >= 10 ? '#2ecc71' : '#e74c3c', fontSize: '11px', margin: 0 }}>
                {s.videoDurasi >= 10 ? '✅ Tercapai' : '❌ Kurang 10 mnt'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // REGISTRASI SISWA
  // ══════════════════════════════════════════════════════════════════
  if (page === 'registerSiswa') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuSiswa" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>REGISTRASI SISWA</p>
      <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '13px', marginBottom: '20px' }}>E-Learning SMA Negeri 1 Lumbanjulu</p>
      {siswaError && <div style={S.errBox}>⚠️ {siswaError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NISN *</label>
        <input style={S.input} placeholder="Nomor Induk Siswa Nasional" value={siswaForm.nisn} onChange={e => updateSiswaForm('nisn', e.target.value)} />
        <label style={S.label}>Nama Lengkap *</label>
        <input style={S.input} placeholder="Nama lengkap" value={siswaForm.nama} onChange={e => updateSiswaForm('nama', e.target.value)} />
        <label style={S.label}>Tanggal Lahir *</label>
        <input style={S.input} type="date" value={siswaForm.tglLahir} onChange={e => updateSiswaForm('tglLahir', e.target.value)} />
        <label style={S.label}>Email *</label>
        <input style={S.input} type="email" placeholder="email@gmail.com" value={siswaForm.email} onChange={e => updateSiswaForm('email', e.target.value)} />
        <label style={S.label}>Nomor Telepon *</label>
        <input style={S.input} type="tel" placeholder="08xxxxxxxxxx" value={siswaForm.telpon} onChange={e => updateSiswaForm('telpon', e.target.value)} />
        <label style={S.label}>Agama *</label>
        <select style={S.select} value={siswaForm.agama} onChange={e => updateSiswaForm('agama', e.target.value)}>
          <option value="">Pilih Agama</option>
          {agamaList.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Kelas *</label>
            <select style={S.select} value={siswaForm.kelas} onChange={e => updateSiswaForm('kelas', e.target.value)}>
              <option value="">Pilih Kelas</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Jurusan *</label>
            <select style={S.select} value={siswaForm.jurusan} onChange={e => updateSiswaForm('jurusan', e.target.value)}>
              <option value="">Pilih</option>
              {['A','B','C','D','E','F','G','H','I','J'].map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Password *</label>
            <div style={S.pwWrap}>
              <input style={{ ...S.input, paddingRight: '36px' }} type={showPassword ? 'text' : 'password'} placeholder="Min. 6 karakter"
                value={siswaForm.password} onChange={e => updateSiswaForm('password', e.target.value)} />
              <button style={S.eyeBtn} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Konfirmasi *</label>
            <div style={S.pwWrap}>
              <input style={{ ...S.input, paddingRight: '36px' }} type={showConfirmPassword ? 'text' : 'password'} placeholder="Ulangi password"
                value={siswaForm.konfirmasi} onChange={e => updateSiswaForm('konfirmasi', e.target.value)} />
              <button style={S.eyeBtn} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
        </div>
        <label style={S.label}>Cita-cita *</label>
        <input style={S.input} placeholder="Menjadi AI Engineer" value={siswaForm.citaCita} onChange={e => updateSiswaForm('citaCita', e.target.value)} />
        <label style={S.label}>Hobby *</label>
        <input style={S.input} placeholder="Membaca, Koding, Gaming" value={siswaForm.hobby} onChange={e => updateSiswaForm('hobby', e.target.value)} />
        <label style={S.label}>Bio Singkat *</label>
        <textarea style={{ ...S.input, height: '80px', resize: 'none' }} placeholder="Ceritakan sedikit tentang dirimu..."
          value={siswaForm.bio} onChange={e => updateSiswaForm('bio', e.target.value)} />
        <label style={S.label}>FOTO SELFIE (Opsional)</label>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '14px', textAlign: 'center', border: '1px solid rgba(0,180,255,0.15)' }}>
          {!cameraActive && !fotoDiambil && (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '6px' }}>📷</div>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px', margin: '0 0 10px' }}>Opsional — bisa dilewati</p>
              <button onClick={startKameraSiswa}
                style={{ background: '#1565c0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                📸 AKTIFKAN KAMERA
              </button>
            </div>
          )}
          {cameraActive && (
            <div>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }} />
              <button onClick={ambilFotoSiswa}
                style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                📸 AMBIL FOTO
              </button>
            </div>
          )}
          <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '8px', display: fotoDiambil ? 'block' : 'none', marginBottom: '10px' }} />
          {fotoDiambil && (
            <div>
              <p style={{ color: '#00d278', fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px' }}>✅ Foto berhasil!</p>
              <button onClick={() => { setFotoDiambil(false); startKameraSiswa(); }}
                style={{ background: '#e07b00', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>
                🔄 Ambil Ulang
              </button>
            </div>
          )}
        </div>
        <button style={S.btnOrange} onClick={registrasiSiswa} disabled={loading}>
          {loading ? '⏳ Mendaftar...' : 'DAFTAR SEKARANG'}
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // REGISTRASI GURU
  // ══════════════════════════════════════════════════════════════════
  if (page === 'registerGuru') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuGuru" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#ffd700', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>REGISTRASI GURU</p>
      <p style={{ color: 'rgba(200,220,255,0.65)', fontSize: '13px', marginBottom: '20px' }}>E-Learning SMA Negeri 1 Lumbanjulu</p>
      {guruError && <div style={S.errBox}>⚠️ {guruError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NIP (Guru PNS) — isi salah satu</label>
        <input style={S.input} placeholder="Nomor Induk Pegawai (jika ada)" value={guruForm.nip} onChange={e => updateGuruForm('nip', e.target.value)} />
        <label style={S.label}>NIK (Guru Honor / semua guru)</label>
        <input style={S.input} placeholder="Nomor Induk Kependudukan" value={guruForm.nik} onChange={e => updateGuruForm('nik', e.target.value)} />
        <label style={S.label}>Nama Lengkap *</label>
        <input style={S.input} placeholder="Nama lengkap sesuai SK" value={guruForm.nama} onChange={e => updateGuruForm('nama', e.target.value)} />
        <label style={S.label}>Nama Panggilan *</label>
        <input style={S.input} placeholder="Pak Budi / Bu Sari" value={guruForm.namaPanggilan} onChange={e => updateGuruForm('namaPanggilan', e.target.value)} />
        <label style={S.label}>Mata Pelajaran yang Diampu *</label>
        <select style={S.select} value={guruForm.mapel} onChange={e => updateGuruForm('mapel', e.target.value)}>
          <option value="">Pilih Mata Pelajaran</option>
          {mapelList.map(m => <option key={m.id} value={m.nama}>{m.nama}</option>)}
        </select>
        <label style={S.label}>Jabatan *</label>
        <select style={S.select} value={guruForm.jabatan} onChange={e => updateGuruForm('jabatan', e.target.value)}>
          <option value="">Pilih Jabatan</option>
          {jabatanList.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <label style={S.label}>Email *</label>
        <input style={S.input} type="email" placeholder="guru@smalumbanjulu.sch.id" value={guruForm.email} onChange={e => updateGuruForm('email', e.target.value)} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Password * (min 6)</label>
            <div style={S.pwWrap}>
              <input style={{ ...S.input, paddingRight: '36px' }} type={showPassword ? 'text' : 'password'} placeholder="Min. 6 karakter"
                value={guruForm.password} onChange={e => updateGuruForm('password', e.target.value)} />
              <button style={S.eyeBtn} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Konfirmasi *</label>
            <div style={S.pwWrap}>
              <input style={{ ...S.input, paddingRight: '36px' }} type={showConfirmPassword ? 'text' : 'password'} placeholder="Ulangi password"
                value={guruForm.konfirmasi} onChange={e => updateGuruForm('konfirmasi', e.target.value)} />
              <button style={S.eyeBtn} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>
        </div>
        <label style={S.label}>Bio Singkat *</label>
        <textarea style={{ ...S.input, height: '80px', resize: 'none' }} placeholder="Ceritakan sedikit tentang diri Anda sebagai pendidik..."
          value={guruForm.bio} onChange={e => updateGuruForm('bio', e.target.value)} />
        <label style={S.label}>FOTO PROFIL (Opsional)</label>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '14px', textAlign: 'center', border: '1px solid rgba(0,180,255,0.15)' }}>
          {!cameraGuruActive && !fotoGuruDiambil && (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '6px' }}>📷</div>
              <p style={{ color: 'rgba(160,200,230,0.5)', fontSize: '13px', margin: '0 0 10px' }}>Opsional — bisa dilewati</p>
              <button onClick={startKameraGuru}
                style={{ background: '#1565c0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                📸 AKTIFKAN KAMERA
              </button>
            </div>
          )}
          {cameraGuruActive && (
            <div>
              <video ref={videoGuruRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }} />
              <button onClick={ambilFotoGuru}
                style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                📸 AMBIL FOTO
              </button>
            </div>
          )}
          <canvas ref={canvasGuruRef} style={{ width: '100%', borderRadius: '8px', display: fotoGuruDiambil ? 'block' : 'none', marginBottom: '10px' }} />
          {fotoGuruDiambil && (
            <div>
              <p style={{ color: '#00d278', fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px' }}>✅ Foto berhasil!</p>
              <button onClick={() => { setFotoGuruDiambil(false); startKameraGuru(); }}
                style={{ background: '#e07b00', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>
                🔄 Ambil Ulang
              </button>
            </div>
          )}
        </div>
        <button style={S.btnOrange} onClick={registrasiGuru} disabled={loading}>
          {loading ? '⏳ Mendaftar...' : 'DAFTAR SEKARANG'}
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // PENGATURAN
  // ══════════════════════════════════════════════════════════════════
  if (page === 'pengaturan') {
    const avatarSiswaLaki = ['👦','🧑','👱','🧔','👮','🧑‍💻','🧑‍🎓','🧑‍🔬','🧑‍🎨','🦸'];
    const avatarSiswaPerempuan = ['👧','👩','👩‍🦰','👩‍🦱','👩‍🦳','👩‍💻','👩‍🎓','👩‍🔬','👩‍🎨','🦸‍♀️'];
    const avatarGuru = ['👨‍🏫','👩‍🏫','🧑‍🏫','👨‍💼','👩‍💼','🧑‍💼','👨‍🎓','👩‍🎓','🧑‍🎓','👨‍⚕️'];
    const avatarList = userRole === 'guru' ? avatarGuru : (userData?.jenis === 'perempuan' ? avatarSiswaPerempuan : [...avatarSiswaLaki, ...avatarSiswaPerempuan]);
    const currentAvatar = selectedAvatar || userData?.avatar || (userRole === 'guru' ? '👨‍🏫' : '🎓');

    return (
      <div style={S.page}>
        <TopBar />
        <BackBtn to="dashboard" />
        <p style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '4px', letterSpacing: '0.5px' }}>⚙️ Pengaturan</p>
        <p style={{ color: 'rgba(150,200,255,0.5)', fontSize: '12px', marginBottom: '20px', letterSpacing: '1px' }}>KELOLA AKUN KAMU</p>

        {pengaturanMsg && <div style={pengaturanMsg.startsWith('✅') || pengaturanMsg.startsWith('📧') ? S.successBox : S.errBox}>{pengaturanMsg}</div>}

        {/* Avatar */}
        <div style={{ ...S.card, border: '1px solid rgba(0,200,255,0.15)' }}>
          <p style={{ color: '#00c8ff', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>🖼️ Pilih Avatar</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,100,200,0.4),rgba(0,50,140,0.6))', border: '2px solid rgba(0,200,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 6px 20px rgba(0,100,200,0.3)' }}>
              {currentAvatar}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px' }}>
            {avatarList.map((av, i) => (
              <button key={i} onClick={() => setSelectedAvatar(av)}
                style={{ padding: '10px', borderRadius: '12px', border: selectedAvatar === av ? '2px solid #00c8ff' : '1px solid rgba(0,200,255,0.1)', background: selectedAvatar === av ? 'rgba(0,200,255,0.15)' : 'rgba(255,255,255,0.03)', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Edit Profil */}
        <div style={{ ...S.card, border: '1px solid rgba(0,200,255,0.15)' }}>
          <p style={{ color: '#00c8ff', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>✏️ Edit Profil</p>
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
          <button onClick={simpanEditProfil} style={{ ...S.btnOrange, marginTop: '4px', padding: '13px', fontSize: '14px' }}>
            💾 Simpan Perubahan
          </button>
        </div>

        {/* Info Akun */}
        <div style={{ ...S.card, border: '1px solid rgba(0,200,255,0.1)' }}>
          <p style={{ color: '#00c8ff', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>📋 Info Akun</p>
          <div style={{ fontSize: '13px', color: 'rgba(180,210,255,0.65)', lineHeight: '2' }}>
            <p style={{ margin: 0 }}>📧 Email: <span style={{ color: 'white' }}>{userData?.email}</span></p>
            {userRole === 'siswa' && <p style={{ margin: 0 }}>🎓 NISN: <span style={{ color: 'white' }}>{userData?.nisn}</span></p>}
            {userRole === 'guru' && userData?.nip && <p style={{ margin: 0 }}>🪪 NIP: <span style={{ color: 'white' }}>{userData?.nip}</span></p>}
            {userRole === 'guru' && userData?.nik && <p style={{ margin: 0 }}>🪪 NIK: <span style={{ color: 'white' }}>{userData?.nik}</span></p>}
          </div>
        </div>

        {/* Ganti Password */}
        <div style={{ ...S.card, border: '1px solid rgba(150,0,255,0.2)' }}>
          <p style={{ color: '#aa66ff', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>🔑 Ganti Password</p>
          <p style={{ color: 'rgba(180,150,255,0.6)', fontSize: '12px', marginBottom: '12px', lineHeight: '1.6' }}>
            Link ganti password akan dikirim ke:<br />
            <strong style={{ color: 'rgba(200,180,255,0.9)' }}>{userData?.email}</strong>
          </p>
          <button onClick={gantiPassword} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,rgba(120,0,200,0.6),rgba(80,0,150,0.8))', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            📧 Kirim Link Reset Password
          </button>
        </div>

        {/* Logout */}
        <button onClick={logout} style={{ width: '100%', padding: '12px', background: 'rgba(255,50,50,0.07)', border: '1px solid rgba(255,70,70,0.18)', color: 'rgba(255,110,110,0.75)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
          🚪 Keluar / Logout
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ABOUT (TENTANG)
  // ══════════════════════════════════════════════════════════════════
  if (page === 'about') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '4px', letterSpacing: '0.5px' }}>ℹ️ Tentang</p>
      <p style={{ color: 'rgba(150,200,255,0.5)', fontSize: '12px', marginBottom: '20px', letterSpacing: '1px' }}>PROFIL SEKOLAH</p>

      {/* Foto & Nama Sekolah */}
      <div style={{ width: '100%', background: 'linear-gradient(135deg,rgba(0,50,120,0.4),rgba(0,30,80,0.6))', border: '1px solid rgba(0,200,255,0.15)', borderRadius: '20px', padding: '24px 18px', marginBottom: '14px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
        {aboutData.fotoSekolah
          ? <img src={aboutData.fotoSekolah} alt="Sekolah" style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', maxHeight: '180px', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '120px', borderRadius: '12px', background: 'rgba(0,100,200,0.1)', border: '1px dashed rgba(0,200,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '40px' }}>🏫</div>
        }
        <img src="/logo_sekolah.png" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '50%', marginBottom: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} />
        <p style={{ color: 'white', fontSize: '17px', fontWeight: '900', margin: '0 0 4px', letterSpacing: '0.5px' }}>{aboutData.namaSekolah || 'SMA NEGERI 1 LUMBANJULU'}</p>
        <p style={{ color: 'rgba(0,200,255,0.7)', fontSize: '12px', margin: '0 0 8px', letterSpacing: '1px' }}>Kabupaten Toba · Sumatera Utara</p>
        {aboutData.tentang && <p style={{ color: 'rgba(180,210,255,0.65)', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{aboutData.tentang}</p>}
      </div>

      {/* Visi Misi */}
      {(aboutData.visi || aboutData.misi) && (
        <div style={{ ...S.card, border: '1px solid rgba(0,200,255,0.12)' }}>
          {aboutData.visi && (
            <div style={{ marginBottom: aboutData.misi ? '14px' : 0 }}>
              <p style={{ color: '#00c8ff', fontWeight: '700', fontSize: '13px', marginBottom: '6px', letterSpacing: '1px' }}>🎯 VISI</p>
              <p style={{ color: 'rgba(180,210,255,0.7)', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{aboutData.visi}</p>
            </div>
          )}
          {aboutData.misi && (
            <div>
              <p style={{ color: '#ffd700', fontWeight: '700', fontSize: '13px', marginBottom: '6px', letterSpacing: '1px' }}>📌 MISI</p>
              <p style={{ color: 'rgba(180,210,255,0.7)', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{aboutData.misi}</p>
            </div>
          )}
        </div>
      )}

      {/* Kepala Sekolah */}
      {(aboutData.namaKepsek || aboutData.fotoKepsek) && (
        <div style={{ ...S.card, border: '1px solid rgba(255,210,0,0.15)', textAlign: 'center' }}>
          <p style={{ color: '#ffd700', fontWeight: '700', fontSize: '13px', marginBottom: '14px', letterSpacing: '1px' }}>👤 KEPALA SEKOLAH</p>
          {aboutData.fotoKepsek
            ? <img src={aboutData.fotoKepsek} alt="Kepsek" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', marginBottom: '10px', border: '2px solid rgba(255,210,0,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} />
            : <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(200,130,0,0.3),rgba(150,80,0,0.5))', border: '2px solid rgba(255,210,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 10px' }}>👤</div>
          }
          <p style={{ color: 'white', fontWeight: '800', fontSize: '15px', margin: '0 0 4px' }}>{aboutData.namaKepsek}</p>
          <p style={{ color: 'rgba(255,210,0,0.6)', fontSize: '12px', margin: 0, letterSpacing: '1px' }}>{aboutData.jabatanKepsek || 'Kepala Sekolah'}</p>
        </div>
      )}

      {/* E-JULU credit */}
      <div style={{ textAlign: 'center', marginTop: '8px', padding: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#0055cc,#0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 8px', boxShadow: '0 4px 14px rgba(0,130,255,0.3)' }}>📚</div>
        <p style={{ color: 'rgba(150,200,255,0.4)', fontSize: '11px', margin: '0 0 2px', letterSpacing: '1px' }}>POWERED BY</p>
        <p style={{ color: 'rgba(0,200,255,0.6)', fontSize: '14px', fontWeight: '900', margin: '0 0 4px', letterSpacing: '2px' }}>E-JULU</p>
        <p style={{ color: 'rgba(150,200,255,0.35)', fontSize: '11px', margin: 0 }}>Dev by Restuadi G. Sinaga, S.Kom</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // ABOUT EDIT (ADMIN)
  // ══════════════════════════════════════════════════════════════════
  if (page === 'adminEditAbout') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="adminSettings" fn={() => setPage('adminSettings')} />
      {adminMsg && <div style={S.successBox}>{adminMsg}</div>}
      <p style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>🏫 Edit Halaman Tentang</p>
      <p style={{ color: 'rgba(150,200,255,0.5)', fontSize: '12px', marginBottom: '20px', letterSpacing: '1px' }}>KONTEN PROFIL SEKOLAH</p>

      <div style={{ ...S.card, border: '1px solid rgba(0,200,255,0.15)', width: '100%' }}>
        <p style={{ color: '#00c8ff', fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>🏫 Info Sekolah</p>
        <label style={S.label}>Nama Sekolah</label>
        <input style={S.input} value={aboutData.namaSekolah} onChange={e => setAboutData(p => ({ ...p, namaSekolah: e.target.value }))} />
        <label style={S.label}>URL Foto Sekolah (Google Drive/link)</label>
        <input style={S.input} placeholder="https://..." value={aboutData.fotoSekolah} onChange={e => setAboutData(p => ({ ...p, fotoSekolah: e.target.value }))} />
        <label style={S.label}>Tentang Sekolah</label>
        <textarea style={{ ...S.input, height: '80px', resize: 'none' }} placeholder="Deskripsi singkat tentang sekolah..." value={aboutData.tentang} onChange={e => setAboutData(p => ({ ...p, tentang: e.target.value }))} />
        <label style={S.label}>Visi</label>
        <textarea style={{ ...S.input, height: '70px', resize: 'none' }} placeholder="Visi sekolah..." value={aboutData.visi} onChange={e => setAboutData(p => ({ ...p, visi: e.target.value }))} />
        <label style={S.label}>Misi</label>
        <textarea style={{ ...S.input, height: '70px', resize: 'none' }} placeholder="Misi sekolah..." value={aboutData.misi} onChange={e => setAboutData(p => ({ ...p, misi: e.target.value }))} />
      </div>

      <div style={{ ...S.card, border: '1px solid rgba(255,210,0,0.2)', width: '100%' }}>
        <p style={{ color: '#ffd700', fontWeight: '700', marginBottom: '12px', fontSize: '14px' }}>👤 Kepala Sekolah</p>
        <label style={S.label}>Nama Kepala Sekolah</label>
        <input style={S.input} placeholder="Nama lengkap..." value={aboutData.namaKepsek} onChange={e => setAboutData(p => ({ ...p, namaKepsek: e.target.value }))} />
        <label style={S.label}>Jabatan</label>
        <input style={S.input} placeholder="Kepala Sekolah" value={aboutData.jabatanKepsek} onChange={e => setAboutData(p => ({ ...p, jabatanKepsek: e.target.value }))} />
        <label style={S.label}>URL Foto Kepala Sekolah</label>
        <input style={S.input} placeholder="https://..." value={aboutData.fotoKepsek} onChange={e => setAboutData(p => ({ ...p, fotoKepsek: e.target.value }))} />
      </div>

      <button onClick={simpanAbout} style={{ ...S.btnOrange, fontSize: '15px', padding: '14px' }}>
        💾 Simpan Halaman Tentang
      </button>
    </div>
  );

}

export default App;
