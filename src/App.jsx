import React, { useState, useRef, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection,
  getDocs, updateDoc, addDoc, deleteDoc, query, where
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
    nip:'', nama:'', namaPanggilan:'', mapel:'',
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
      if(user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if(docSnap.exists()) {
          const data = docSnap.data();
          if(data.status === 'approved') {
            setUserData(data);
            setUserRole(data.role);
            setPage('dashboard');
          } else if(data.status === 'pending') {
            setPage('menunggu');
          } else {
            setPage('ditolak');
          }
        }
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // ── Deteksi keluar saat quiz ───────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if(document.hidden && page === 'quiz') {
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
    if(page === 'quiz' && !quizSelesai) {
      const pgSoal = quizSoalAcak.filter(s => s.tipe === 'pg');
      if(quizSoalIndex >= pgSoal.length) return;
      setTimer(20);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if(prev <= 1) {
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
    if(quizSoalIndex < pgSoal.length - 1) {
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

  // ── Load soal quiz dari Firestore ──────────────────────────────
  const loadSoal = async (babId) => {
    const q = query(collection(db, 'soal'), where('babId', '==', babId));
    const snap = await getDocs(q);
    setQuizSoalList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ── Load hasil siswa ───────────────────────────────────────────
  const loadHasilSiswa = async (babId) => {
    const q = query(collection(db, 'hasilQuiz'), where('babId', '==', babId));
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
    if(!pgSoal.length) return 0;
    const benar = pgSoal.filter(s => quizJawaban[s.id] === s.kunci).length;
    return Math.round((benar / pgSoal.length) * 20);
  };

  const acakSoal = (soalList) => {
    const pg = soalList.filter(s => s.tipe === 'pg').sort(() => Math.random() - 0.5);
    const essay = soalList.filter(s => s.tipe === 'essay');
    return [...pg, ...essay];
  };

  // ── Simpan hasil quiz ke Firestore ─────────────────────────────
  const simpanHasilQuiz = async () => {
    if(!userData || !selectedBab) return;
    const poinPG = hitungPoinPG();
    const essayJawaban = quizSoalAcak
      .filter(s => s.tipe === 'essay')
      .map(s => ({ soalId: s.id, soal: s.soal, jawaban: quizJawaban[s.id] || '' }));

    await addDoc(collection(db, 'hasilQuiz'), {
      babId: selectedBab.id,
      mapel: selectedMapel.nama,
      siswaId: userData.uid,
      siswaNama: userData.nama,
      siswaKelas: `${userData.kelas}-${userData.jurusan}`,
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
    if(!f.nisn||!f.nama||!f.tglLahir||!f.email||!f.telpon||!f.agama||
       !f.password||!f.konfirmasi||!f.kelas||!f.jurusan||!f.citaCita||!f.hobby||!f.bio) {
      setSiswaError('Semua field wajib diisi!'); return;
    }
    if(f.password !== f.konfirmasi) { setSiswaError('Password tidak cocok!'); return; }
    if(f.password.length < 6) { setSiswaError('Password minimal 6 karakter!'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      let fotoUrl = '';
      
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, role: 'siswa', status: 'pending',
        nisn: f.nisn, nama: f.nama, tglLahir: f.tglLahir,
        email: f.email, telpon: f.telpon, agama: f.agama,
        kelas: f.kelas, jurusan: f.jurusan, citaCita: f.citaCita,
        hobby: f.hobby, bio: f.bio, fotoUrl,
        poinPG: 0, poinEssay: 0, poinModul: 0,
        pelanggaran: 0, createdAt: new Date()
      });
      await signOut(auth);
      setSiswaError('');
      setPage('menunggu');
    } catch(e) {
      setSiswaError(e.message.includes('email-already-in-use')
        ? 'Email sudah terdaftar!' : 'Gagal mendaftar: ' + e.message);
    }
    setLoading(false);
  };

  // ── Registrasi Guru ────────────────────────────────────────────
  const registrasiGuru = async () => {
    const f = guruForm;
    if(!f.nama||!f.namaPanggilan||!f.mapel||!f.jabatan||
       !f.email||!f.password||!f.konfirmasi||!f.bio) {
      setGuruError('Semua field wajib diisi!'); return;
    }
    if(!f.nip && !f.nik) { setGuruError('NIP atau NIK wajib diisi!'); return; }
    if(f.password !== f.konfirmasi) { setGuruError('Password tidak cocok!'); return; }
    if(f.password.length < 6) { setGuruError('Password minimal 6 karakter!'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
      let fotoUrl = '';
      
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
    } catch(e) {
      setGuruError(e.message.includes('email-already-in-use')
        ? 'Email sudah terdaftar!' : 'Gagal mendaftar: ' + e.message);
    }
    setLoading(false);
  };

  // ── Login Siswa ────────────────────────────────────────────────
  const loginSiswa = async () => {
    if(!siswaLoginNISN || !siswaLoginPassword) {
      setLoginError('NISN dan password wajib diisi!'); return;
    }
    setLoading(true);
    setLoginError('');
    try {
      const q = query(collection(db, 'users'),
        where('nisn', '==', siswaLoginNISN),
        where('role', '==', 'siswa'));
      const snap = await getDocs(q);
      if(snap.empty) { setLoginError('NISN tidak ditemukan!'); setLoading(false); return; }
      const siswaData = snap.docs[0].data();
      if(siswaData.status === 'pending') {
        setLoginError('Akun belum disetujui admin!'); setLoading(false); return;
      }
      if(siswaData.status === 'rejected') {
        setLoginError('Akun ditolak. Hubungi admin sekolah.'); setLoading(false); return;
      }
      await signInWithEmailAndPassword(auth, siswaData.email, siswaLoginPassword);
      setUserData(siswaData);
      setUserRole('siswa');
      setPage('dashboard');
    } catch(e) {
      setLoginError('Password salah!');
    }
    setLoading(false);
  };

  // ── Login Guru ─────────────────────────────────────────────────
  const loginGuru = async () => {
    if(!guruLoginNIP || !guruLoginPassword) {
      setLoginError('NIP/NIK dan password wajib diisi!'); return;
    }
    setLoading(true);
    setLoginError('');
    try {
      const q = query(collection(db, 'users'),
        where('role', '==', 'guru'));
      const snap = await getDocs(q);
      const guruDoc = snap.docs.find(d => {
        const data = d.data();
        return data.nip === guruLoginNIP || data.nik === guruLoginNIP;
      });
      if(!guruDoc) { setLoginError('NIP/NIK tidak ditemukan!'); setLoading(false); return; }
      const guruData = guruDoc.data();
      if(guruData.status === 'pending') {
        setLoginError('Akun belum disetujui admin!'); setLoading(false); return;
      }
      if(guruData.status === 'rejected') {
        setLoginError('Akun ditolak. Hubungi admin sekolah.'); setLoading(false); return;
      }
      await signInWithEmailAndPassword(auth, guruData.email, guruLoginPassword);
      setUserData(guruData);
      setUserRole('guru');
      setPage('dashboard');
    } catch(e) {
      setLoginError('Password salah!');
    }
    setLoading(false);
  };

  // ── Logout ─────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    setUserRole(null);
    setPage('role');
  };

  // ── Tambah Bab ─────────────────────────────────────────────────
  const tambahBab = async () => {
    if(!babBaru.trim()) return;
    const docRef = await addDoc(collection(db, 'bab'), {
      mapel: selectedMapel.nama, judul: babBaru,
      modul: '', modul2: '', video: '',
      urutan: babList.length + 1, createdAt: new Date()
    });
    setBabList(prev => [...prev, { id: docRef.id, mapel: selectedMapel.nama, judul: babBaru, modul: '', modul2: '', video: '', urutan: babList.length + 1 }]);
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
    if(!soalBaru.soal.trim()) return;
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
    if(!essayBaru.trim()) return;
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

  // ── STYLES ────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#0a1628 0%,#0d2137 60%,#0a1628 100%)',
      color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 16px 40px', fontFamily: "'Segoe UI',sans-serif",
      maxWidth: '430px', margin: '0 auto',
    },
    input: {
      width: '100%', padding: '12px 14px', borderRadius: '8px',
      border: '1px solid #2a5f7a', background: 'rgba(255,255,255,0.08)',
      color: 'white', fontSize: '14px', marginBottom: '10px',
      outline: 'none', boxSizing: 'border-box',
    },
    label: { fontSize: '13px', color: '#cde8f0', marginBottom: '4px', display: 'block' },
    select: {
      width: '100%', padding: '12px 14px', borderRadius: '8px',
      border: '1px solid #2a5f7a', background: '#0d2137',
      color: 'white', fontSize: '14px', marginBottom: '10px',
      outline: 'none', boxSizing: 'border-box',
    },
    btnBack: {
      alignSelf: 'flex-start',
      background: 'linear-gradient(135deg,#1565c0,#0d47a1)',
      border: '2px solid #4fc3f7', color: 'white', fontSize: '15px',
      fontWeight: 'bold', padding: '10px 24px', borderRadius: '10px',
      cursor: 'pointer', marginBottom: '14px',
    },
    btnOrange: {
      width: '100%', padding: '14px', borderRadius: '30px', border: 'none',
      background: 'linear-gradient(135deg,#f0a500,#e07b00)',
      color: 'white', fontWeight: 'bold', fontSize: '18px',
      cursor: 'pointer', marginTop: '8px',
    },
    btnBlue: {
      flex: 1, padding: '16px', borderRadius: '12px',
      border: '2px solid #4fc3f7',
      background: 'linear-gradient(180deg,#1565c0 0%,#0d47a1 60%,#1565c0 100%)',
      cursor: 'pointer', fontWeight: 'bold', fontSize: '20px',
    },
    btnTeal: {
      width: '100%', padding: '18px', borderRadius: '12px', border: 'none',
      background: 'linear-gradient(135deg,#1a5276,#117a65)',
      color: 'white', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
      marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '14px',
    },
    btnGold: {
      width: '100%', padding: '18px', borderRadius: '12px', border: 'none',
      background: 'linear-gradient(135deg,#b7860b,#8B6914)',
      color: 'white', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '14px',
    },
    pwWrap: { position: 'relative', width: '100%' },
    eyeBtn: {
      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-60%)',
      background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '16px',
    },
    errBox: {
      background: 'rgba(231,76,60,0.2)', border: '1px solid #e74c3c',
      borderRadius: '8px', padding: '10px 14px',
      color: '#ff6b6b', fontSize: '13px', marginBottom: '12px', width: '100%',
    },
    card: {
      background: 'rgba(255,255,255,0.07)', borderRadius: '12px',
      padding: '16px', width: '100%', marginBottom: '12px',
    },
    linkBtn: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '13px 16px', borderRadius: '10px', color: 'white',
      fontWeight: 'bold', fontSize: '14px', textDecoration: 'none',
    },
  };

  const TopBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', width: '100%' }}>
      <span style={{ fontSize: '26px' }}>📚</span>
      <span style={{ fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '1px' }}>E-JULU</span>
    </div>
  );

  const Footer = () => (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px',
      background: 'linear-gradient(90deg,#0d3320,#145a32,#0d3320)',
      borderTop: '1px solid #27ae60', padding: '10px 16px',
      textAlign: 'center', fontSize: '12px', color: '#2ecc71', fontWeight: '600', zIndex: 999,
    }}>✦ Development By Restuadi G. Sinaga, S.Kom ✦</div>
  );

  const BackBtn = ({ to, fn }) => (
    <button style={S.btnBack} onClick={() => { if(fn) fn(); else setPage(to); }}>← Kembali</button>
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
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
      <p style={{ color: '#aaa' }}>Mohon tunggu...</p>
    </div>
  );

  if(!authReady) return (
    <div style={{ ...S.page, justifyContent: 'center' }}>
      <TopBar />
      <LoadingSpinner />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // SPLASH
  // ══════════════════════════════════════════════════════════════════
  if(page === 'splash') return (
    <div style={S.page}>
      <TopBar />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '64px', marginBottom: '12px' }} />
      <p style={{ color: 'white', fontSize: '18px', fontWeight: '600', textAlign: 'center', margin: '4px 0' }}>Selamat Datang di E-Julu!</p>
      <p style={{ color: '#00e5ff', fontSize: '22px', fontWeight: '700', margin: '2px 0' }}>E-Learning</p>
      <p style={{ color: '#f0e000', fontSize: '20px', fontWeight: '900', textAlign: 'center', margin: '2px 0 20px' }}>SMA NEGERI 1 LUMBANJULU</p>
      <img src="/logo_sekolah.png" alt="Logo" style={{ width: '210px', marginBottom: '24px' }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
        <img src="/robot.png" alt="Robot" style={{ height: '155px' }} />
        <button onClick={() => setPage('role')}
          style={{ ...S.btnOrange, width: 'auto', padding: '14px 44px', fontSize: '22px', marginBottom: '10px' }}>
          START
        </button>
      </div>
      <Footer />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // MENUNGGU & DITOLAK
  // ══════════════════════════════════════════════════════════════════
  if(page === 'menunggu') return (
    <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
      <TopBar />
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
      <p style={{ color: '#f0e000', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Pendaftaran Terkirim!</p>
      <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
        Akun kamu sedang menunggu<br />persetujuan dari admin.<br />
        Kamu akan bisa login setelah<br />admin menyetujui pendaftaranmu.
      </p>
      <div style={{ ...S.card, border: '1px solid #4fc3f7' }}>
        <p style={{ color: '#4fc3f7', fontSize: '13px', margin: 0 }}>
          💡 Hubungi admin sekolah jika butuh konfirmasi lebih cepat.
        </p>
      </div>
      <button onClick={() => setPage('role')} style={{ ...S.btnOrange, marginTop: '16px' }}>← Kembali ke Halaman Utama</button>
    </div>
  );

  if(page === 'ditolak') return (
    <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
      <TopBar />
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
      <p style={{ color: '#e74c3c', fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>Pendaftaran Ditolak</p>
      <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
        Maaf, pendaftaran kamu ditolak oleh admin.<br />
        Hubungi admin sekolah untuk informasi lebih lanjut.
      </p>
      <button onClick={() => setPage('role')} style={S.btnOrange}>← Kembali ke Halaman Utama</button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // PILIH ROLE
  // ══════════════════════════════════════════════════════════════════
  if(page === 'role') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="splash" />
      <p style={{ fontSize: '18px', textAlign: 'center', margin: '20px 0 28px', lineHeight: '1.7' }}>
        Untuk melanjutkan<br />apakah anda sebagai:
      </p>
      <div style={{ display: 'flex', gap: '16px', width: '100%', marginBottom: '40px' }}>
        <button onClick={() => setPage('menuGuru')} style={{ ...S.btnBlue, color: '#00e5ff' }}>GURU</button>
        <button onClick={() => setPage('menuSiswa')} style={{ ...S.btnBlue, color: '#f0e000' }}>SISWA</button>
      </div>
      <img src="/robot.png" alt="Robot" style={{ height: '190px', alignSelf: 'flex-start' }} />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // MENU SISWA & GURU
  // ══════════════════════════════════════════════════════════════════
  if(page === 'menuSiswa') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="role" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#f0e000', fontSize: '22px', fontWeight: '900', textAlign: 'center' }}>MENU AKSES SISWA</p>
      <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '24px' }}>E-Learning SMA Negeri 1 Lumbanjulu</p>
      <img src="/logo_sekolah.png" alt="Logo" style={{ width: '155px', marginBottom: '32px' }} />
      <button style={S.btnTeal} onClick={() => setPage('loginSiswa')}>
        <span style={{ fontSize: '28px' }}>👤</span><span>LOGIN SISWA</span>
      </button>
      <button style={S.btnGold} onClick={() => setPage('registerSiswa')}>
        <span style={{ fontSize: '28px' }}>📝</span><span>REGISTRASI SISWA BARU</span>
      </button>
    </div>
  );

  if(page === 'menuGuru') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="role" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#f0e000', fontSize: '22px', fontWeight: '900', textAlign: 'center' }}>MENU AKSES GURU</p>
      <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '24px' }}>E-Learning SMA Negeri 1 Lumbanjulu</p>
      <img src="/logo_sekolah.png" alt="Logo" style={{ width: '155px', marginBottom: '32px' }} />
      <button style={S.btnTeal} onClick={() => setPage('loginGuru')}>
        <span style={{ fontSize: '28px' }}>👨‍🏫</span><span>LOGIN GURU</span>
      </button>
      <button style={S.btnGold} onClick={() => setPage('registerGuru')}>
        <span style={{ fontSize: '28px' }}>📝</span><span>REGISTRASI GURU BARU</span>
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // LOGIN SISWA & GURU
  // ══════════════════════════════════════════════════════════════════
  if(page === 'loginSiswa') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuSiswa" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#f0e000', fontSize: '24px', fontWeight: '900', marginBottom: '6px' }}>LOGIN SISWA</p>
      <p style={{ color: '#ccc', fontSize: '14px', textAlign: 'center', marginBottom: '28px', lineHeight: '1.6' }}>
        Anda login sebagai siswa<br />silahkan isi data berikut
      </p>
      {loginError && <div style={S.errBox}>⚠️ {loginError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NISN:</label>
        <input style={S.input} type="text" placeholder="Masukkan NISN"
          value={siswaLoginNISN} onChange={e => setSiswaLoginNISN(e.target.value)} />
        <label style={S.label}>Password:</label>
        <PwInput placeholder="••••••••" val={siswaLoginPassword}
          setVal={setSiswaLoginPassword} show={showLoginPassword} setShow={setShowLoginPassword} />
        <p style={{ color: '#4fc3f7', fontSize: '12px', textAlign: 'right', marginBottom: '8px', cursor: 'pointer' }}>
          Lupa Password?
        </p>
        <div style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid #f0c040', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ color: '#f0c040', fontSize: '12px', margin: 0 }}>⚠️ Akun harus sudah disetujui admin untuk bisa login.</p>
        </div>
        <button style={{ ...S.btnGold, borderRadius: '30px', justifyContent: 'center', fontSize: '17px' }}
          onClick={loginSiswa} disabled={loading}>
          {loading ? '⏳ Memproses...' : '→ Masuk'}
        </button>
      </div>
    </div>
  );

  if(page === 'loginGuru') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuGuru" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#f0e000', fontSize: '24px', fontWeight: '900', marginBottom: '6px' }}>LOGIN GURU</p>
      <p style={{ color: '#ccc', fontSize: '14px', textAlign: 'center', marginBottom: '28px', lineHeight: '1.6' }}>
        Anda login sebagai guru<br />silahkan isi data berikut
      </p>
      {loginError && <div style={S.errBox}>⚠️ {loginError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NIP / NIK:</label>
        <input style={S.input} type="text" placeholder="Masukkan NIP atau NIK"
          value={guruLoginNIP} onChange={e => setGuruLoginNIP(e.target.value)} />
        <label style={S.label}>Password:</label>
        <PwInput placeholder="••••••••" val={guruLoginPassword}
          setVal={setGuruLoginPassword} show={showLoginPassword} setShow={setShowLoginPassword} />
        <p style={{ color: '#4fc3f7', fontSize: '12px', textAlign: 'right', marginBottom: '8px', cursor: 'pointer' }}>
          Lupa Password?
        </p>
        <div style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid #f0c040', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
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
  if(page === 'dashboard') return (
    <div style={S.page}>
      <TopBar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 20px', marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: '26px' }}>⚙️</div>
          <div style={{ fontSize: '11px', color: '#aaa' }}>Pengaturan</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f0e000', fontSize: '13px', fontWeight: '700', margin: 0 }}>
            {userRole === 'guru' ? '👨‍🏫 Guru' : '🎓 Siswa'}
          </p>
          <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>{userData?.nama}</p>
        </div>
        <div style={{ textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: '26px' }}>👤</div>
          <div style={{ fontSize: '11px', color: '#aaa' }}>Profil</div>
        </div>
      </div>

      {userRole === 'siswa' && (
        <div style={{ ...S.card, border: '1px solid #27ae60', marginBottom: '16px' }}>
          <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px' }}>📊 Total Poin Kamu</p>
          <p style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>
            {(userData?.poinPG || 0) + (userData?.poinEssay || 0) + (userData?.poinModul || 0)}/100
          </p>
        </div>
      )}

      {[
        { label: 'Forum Belajar Online', icon: '💬', warna: '#6c3483', to: 'forum' },
        { label: 'Daftar Siswa',         icon: '👥', warna: '#2471a3', to: '' },
        { label: 'Daftar Guru',          icon: '👨‍🏫', warna: '#cb4335', to: '' },
        { label: 'Perpustakaan',         icon: '📚', warna: '#1e8449', to: '' },
        { label: 'Ujian Sekolah',        icon: '📋', warna: '#922b21', to: '' },
        { label: 'Pesan Notifikasi',     icon: '🔔', warna: '#2980b9', to: '' },
      ].map((m, i) => (
        <button key={i} onClick={() => { if(m.to) setPage(m.to); }}
          style={{
            width: '100%', padding: '18px 24px', borderRadius: '30px', border: 'none',
            background: `linear-gradient(135deg,${m.warna},${m.warna}bb)`,
            color: 'white', fontWeight: 'bold', fontSize: '17px', cursor: 'pointer',
            marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 4px 15px ${m.warna}44`,
          }}>
          <span>{m.label}</span>
          <span style={{ fontSize: '22px' }}>{m.icon}</span>
        </button>
      ))}

      <button onClick={logout}
        style={{ marginTop: '16px', background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '10px', padding: '10px 30px', cursor: 'pointer', fontSize: '14px' }}>
        🚪 Keluar / Logout
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  // FORUM — PILIH MAPEL
  // ══════════════════════════════════════════════════════════════════
  if(page === 'forum') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="dashboard" />
      <p style={{ color: '#f0e000', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>Forum Belajar Online</p>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '20px' }}>Pilih Mata Pelajaran</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
        {mapelList.map(m => {
          const bisaAkses = userRole === 'siswa' || userData?.mapel === m.nama;
          return (
            <button key={m.id}
              onClick={() => {
                if(!bisaAkses) { alert(`Kamu hanya bisa mengakses ${userData?.mapel}`); return; }
                setSelectedMapel(m);
                loadBab(m.nama);
                setPage('forumBab');
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
  // FORUM — DAFTAR BAB
  // ══════════════════════════════════════════════════════════════════
  if(page === 'forumBab') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forum" />
      <p style={{ color: '#f0e000', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>
        {selectedMapel?.icon} {selectedMapel?.nama}
      </p>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '20px' }}>Pilih Bab Pembelajaran</p>
      <div style={{ width: '100%' }}>
        {babList.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', border: '1px solid #2a5f7a' }}>
            <p style={{ color: '#aaa', fontSize: '14px' }}>
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
                    <span style={{ color: '#4fc3f7', fontSize: '20px' }}>›</span>
                  </div>
                </button>
            }
          </div>
        ))}

        {userRole === 'guru' && (
          <div style={{ ...S.card, border: '1px solid #27ae60', marginTop: '8px' }}>
            <p style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>+ Tambah Bab Baru</p>
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
  if(page === 'forumIsiBab') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumBab" fn={() => { stopTimerModul(); stopTimerVideo(); setPage('forumBab'); }} />
      <p style={{ color: '#f0e000', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>{selectedBab?.judul}</p>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>{selectedMapel?.nama}</p>

      {userRole === 'siswa' && (
        <div style={{ ...S.card, border: '1px solid #27ae60', marginBottom: '16px' }}>
          <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '13px', margin: 0 }}>
            📊 Poin Modul: {hitungPoinModul()}/50 pts &nbsp;|&nbsp;
            📖 {modulDurasi} mnt &nbsp;|&nbsp; 🎥 {videoDurasi} mnt
          </p>
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Modul 1 */}
        <div style={{ ...S.card, border: '1px solid #2a5f7a' }}>
          <p style={{ color: '#4fc3f7', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>📄 Modul Pembelajaran</p>
          {userRole === 'siswa'
            ? selectedBab?.modul
              ? <a href={selectedBab.modul} target="_blank" rel="noreferrer"
                  onClick={() => { if(!modulTimerRef.current) mulaiTimerModul(); }}
                  style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#1565c0,#0d47a1)' }}>
                  <span style={{ fontSize: '20px' }}>📂</span> Buka Modul
                </a>
              : <p style={{ color: '#aaa', fontSize: '13px' }}>Belum ada modul dari guru.</p>
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
        <div style={{ ...S.card, border: '1px solid #2a5f7a' }}>
          <p style={{ color: '#4fc3f7', fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>📄 Modul Pembelajaran Lainnya</p>
          {userRole === 'siswa'
            ? selectedBab?.modul2
              ? <a href={selectedBab.modul2} target="_blank" rel="noreferrer"
                  onClick={() => { if(!modulTimerRef.current) mulaiTimerModul(); }}
                  style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#1565c0,#0d47a1)' }}>
                  <span style={{ fontSize: '20px' }}>📂</span> Buka Modul Lainnya
                </a>
              : <p style={{ color: '#aaa', fontSize: '13px' }}>Belum ada modul dari guru.</p>
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
                  onClick={() => { if(!videoTimerRef.current) mulaiTimerVideo(); }}
                  style={{ ...S.linkBtn, background: 'linear-gradient(135deg,#c0392b,#922b21)' }}>
                  <span style={{ fontSize: '20px' }}>▶️</span> Tonton Video YouTube
                </a>
              : <p style={{ color: '#aaa', fontSize: '13px' }}>Belum ada video dari guru.</p>
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
              : <p style={{ color: '#aaa', fontSize: '13px' }}>Belum ada soal dari guru.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setPage('guruBuatQuiz')}
                  style={{ background: '#8e44ad', border: 'none', color: 'white', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  ✏️ Buat / Edit Soal Quiz
                </button>
                <button onClick={() => { loadHasilSiswa(selectedBab.id); setPage('guruKelola'); }}
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
  if(page === 'quiz') {
    const pgSoal = quizSoalAcak.filter(s => s.tipe === 'pg');
    const essaySoal = quizSoalAcak.filter(s => s.tipe === 'essay');

    if(quizSelesai) {
      const poinPG = hitungPoinPG();
      simpanHasilQuiz();
      return (
        <div style={{ ...S.page, justifyContent: 'center', textAlign: 'center' }}>
          <TopBar />
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
          <p style={{ color: '#f0e000', fontSize: '22px', fontWeight: '900', marginBottom: '16px' }}>Quiz Selesai!</p>
          <div style={{ ...S.card, border: '1px solid #27ae60', textAlign: 'left', marginBottom: '16px' }}>
            <p style={{ color: '#2ecc71', fontWeight: 'bold', marginBottom: '8px' }}>📊 Hasil Quiz Kamu:</p>
            <p style={{ color: '#ccc', fontSize: '14px', margin: '4px 0' }}>
              ✅ Pilihan Ganda: <strong style={{ color: 'white' }}>{poinPG}/20 pts</strong>
            </p>
            <p style={{ color: '#ccc', fontSize: '14px', margin: '4px 0' }}>
              ✍️ Essay: <strong style={{ color: '#f39c12' }}>Menunggu penilaian guru (maks 30 pts)</strong>
            </p>
            <p style={{ color: '#ccc', fontSize: '14px', margin: '4px 0' }}>
              📖 Modul + Video: <strong style={{ color: 'white' }}>{hitungPoinModul()}/50 pts</strong>
            </p>
          </div>
          <button onClick={() => setPage('forumIsiBab')} style={S.btnOrange}>← Kembali ke Bab</button>
        </div>
      );
    }

    if(quizSoalIndex < pgSoal.length) {
      const soal = pgSoal[quizSoalIndex];
      const persen = (timer / 20) * 100;
      const warnaTimer = timer > 10 ? '#2ecc71' : timer > 5 ? '#f39c12' : '#e74c3c';
      return (
        <div style={{ ...S.page, userSelect: 'none', WebkitUserSelect: 'none' }}
          onContextMenu={e => e.preventDefault()}>
          <TopBar />
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#aaa', fontSize: '13px' }}>PG {quizSoalIndex + 1}/{pgSoal.length}</span>
              <span style={{ color: warnaTimer, fontSize: '15px', fontWeight: 'bold' }}>⏱️ {timer}s</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
              <div style={{ height: '6px', background: '#f0a500', borderRadius: '3px', width: `${((quizSoalIndex + 1) / pgSoal.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '4px' }}>
              <div style={{ height: '4px', background: warnaTimer, borderRadius: '3px', width: `${persen}%`, transition: 'width 1s linear' }} />
            </div>
          </div>
          <div style={{ ...S.card, border: '1px solid #2a5f7a', marginBottom: '16px' }}>
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
    if(essayIndex < essaySoal.length) {
      const soal = essaySoal[essayIndex];
      return (
        <div style={{ ...S.page, userSelect: 'none', WebkitUserSelect: 'none' }}
          onContextMenu={e => e.preventDefault()}>
          <TopBar />
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#aaa', fontSize: '13px' }}>Essay {essayIndex + 1}/{essaySoal.length}</span>
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
            if(essayIndex < essaySoal.length - 1) setQuizSoalIndex(i => i + 1);
            else setQuizSelesai(true);
          }} style={{ ...S.btnOrange, marginTop: '16px' }}>
            {essayIndex < essaySoal.length - 1 ? 'Selanjutnya →' : '✅ Selesai & Kirim'}
          </button>
        </div>
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // GURU — BUAT QUIZ
  // ══════════════════════════════════════════════════════════════════
  if(page === 'guruBuatQuiz') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumIsiBab" />
      <p style={{ color: '#f0e000', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>Buat / Edit Soal Quiz</p>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '20px' }}>{selectedMapel?.nama} — {selectedBab?.judul}</p>

      {quizSoalList.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', border: '1px solid #2a5f7a' }}>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Belum ada soal. Tambahkan di bawah.</p>
        </div>
      )}

      {quizSoalList.map((q, i) => (
        <div key={q.id} style={{ ...S.card, border: '1px solid #2a5f7a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#4fc3f7', fontWeight: 'bold', fontSize: '14px' }}>
              Soal {i + 1} — {q.tipe === 'pg' ? 'Pilihan Ganda' : 'Essay'}
            </span>
            <button onClick={() => hapusSoal(q.id)}
              style={{ background: '#c0392b', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>
              🗑️
            </button>
          </div>
          <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5' }}>{q.soal}</p>
          {q.tipe === 'pg' && (
            <div>
              {q.opsi.map((op, j) => (
                <p key={j} style={{ color: op[0] === q.kunci ? '#2ecc71' : '#aaa', fontSize: '13px', margin: '2px 0' }}>
                  {op[0] === q.kunci ? '✅ ' : ''}{op}
                </p>
              ))}
              <p style={{ color: '#f0e000', fontSize: '12px', marginTop: '4px' }}>Kunci: {q.kunci}</p>
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
  if(page === 'guruKelola') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="forumIsiBab" />
      <p style={{ color: '#f0e000', fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>Hasil Siswa</p>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>{selectedMapel?.nama} — {selectedBab?.judul}</p>

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
        <div style={{ ...S.card, textAlign: 'center', border: '1px solid #2a5f7a' }}>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Belum ada siswa yang mengerjakan quiz.</p>
        </div>
      )}

      {lihatTab === 'pg' && hasilSiswa.map((s, i) => (
        <div key={i} style={{ ...S.card, border: '1px solid #2a5f7a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 'bold', margin: '0 0 2px', fontSize: '15px' }}>{s.siswaNama}</p>
              <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>Kelas {s.siswaKelas}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#2ecc71', fontWeight: 'bold', margin: 0 }}>{s.poinPG}/20 pts</p>
              <p style={{ color: '#aaa', fontSize: '11px', margin: 0 }}>{s.poinPG >= 12 ? '✅ Lulus' : '❌ Remedial'}</p>
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
          <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 10px' }}>Kelas {s.siswaKelas}</p>
          {s.essayJawaban?.map((ej, j) => (
            <div key={j} style={{ marginBottom: '10px' }}>
              <p style={{ color: '#f39c12', fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px' }}>Soal: {ej.soal}</p>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
                <p style={{ color: '#ccc', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                  {ej.jawaban || <span style={{ color: '#555' }}>Tidak dijawab</span>}
                </p>
              </div>
            </div>
          ))}
          {s.nilaiEssay !== null && s.nilaiEssay !== undefined
            ? <p style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '14px' }}>✅ Nilai Essay: {s.nilaiEssay}/100</p>
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
        <div key={i} style={{ ...S.card, border: '1px solid #2a5f7a' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px', fontSize: '15px' }}>{s.siswaNama}</p>
          <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 10px' }}>Kelas {s.siswaKelas}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ color: '#4fc3f7', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{s.modulDurasi} mnt</p>
              <p style={{ color: '#aaa', fontSize: '11px', margin: 0 }}>Baca Modul</p>
              <p style={{ color: s.modulDurasi >= 120 ? '#2ecc71' : '#e74c3c', fontSize: '11px', margin: 0 }}>
                {s.modulDurasi >= 120 ? '✅ Tercapai' : '❌ Kurang 2 jam'}
              </p>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ color: '#e74c3c', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{s.videoDurasi} mnt</p>
              <p style={{ color: '#aaa', fontSize: '11px', margin: 0 }}>Tonton Video</p>
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
  if(page === 'registerSiswa') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuSiswa" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#f0e000', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>REGISTRASI SISWA</p>
      <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '20px' }}>E-Learning SMA Negeri 1 Lumbanjulu</p>
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
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '14px', textAlign: 'center', border: '1px solid #2a5f7a' }}>
          {!cameraActive && !fotoDiambil && (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '6px' }}>📷</div>
              <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 10px' }}>Opsional — bisa dilewati</p>
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
              <p style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px' }}>✅ Foto berhasil!</p>
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
  if(page === 'registerGuru') return (
    <div style={S.page}>
      <TopBar />
      <BackBtn to="menuGuru" />
      <img src="/bbb.png" alt="E-JULU" style={{ height: '60px', marginBottom: '12px' }} />
      <p style={{ color: '#f0e000', fontSize: '20px', fontWeight: '900', marginBottom: '2px' }}>REGISTRASI GURU</p>
      <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '20px' }}>E-Learning SMA Negeri 1 Lumbanjulu</p>
      {guruError && <div style={S.errBox}>⚠️ {guruError}</div>}
      <div style={{ width: '100%' }}>
        <label style={S.label}>NIP (Guru PNS) — isi salah satu</label>
        <input style={S.input} placeholder="Nomor Induk Pegawai (jika ada)" value={guruForm.nip || ''} onChange={e => updateGuruForm('nip', e.target.value)} />
        <label style={S.label}>NIK (Guru Honor / semua guru)</label>
        <input style={S.input} placeholder="Nomor Induk Kependudukan" value={guruForm.nik || ''} onChange={e => updateGuruForm('nik', e.target.value)} />
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
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '14px', textAlign: 'center', border: '1px solid #2a5f7a' }}>
          {!cameraGuruActive && !fotoGuruDiambil && (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '6px' }}>📷</div>
              <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 10px' }}>Opsional — bisa dilewati</p>
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
              <p style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px' }}>✅ Foto berhasil!</p>
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
}

export default App;