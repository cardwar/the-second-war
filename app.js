// Firebase SDK (모듈)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ▶ 콘솔의 '웹앱(</>) 추가'에서 SDK 구성 값을 복사해 정확히 채우세요 */
const firebaseConfig = {
  apiKey: "AIzaSyA7hIlUS6esgWM_iSxLJUmB2_LfyIPksWo",
  authDomain: "the-second-war.firebaseapp.com",
  projectId: "the-second-war",
  storageBucket: "the-second-war.appspot.com",
  messagingSenderId: "538510646722",        // 콘솔 값 확인 권장
  appId: "YOUR_APP_ID_FROM_CONSOLE"         // 콘솔에서 복사
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* DOM */
const $ = id => document.getElementById(id);
const suNickname = $('suNickname');
const suPassword = $('suPassword');
const suHint     = $('suHint');
const liNickname = $('liNickname');
const liPassword = $('liPassword');
const liHint     = $('liHint');

/* 닉네임 → 가짜 이메일 */
const NICK_COLLECTION = "nicknames";
const USERS_COLLECTION= "users";
const domain = "nick.local";

const normNick    = n => n.trim().toLowerCase().replace(/\s+/g,'');
const isValidNick = n => /^[a-z0-9]{3,20}$/.test(n);
const emailFromNick = n => `${n}@${domain}`;

/* 가입 */
$('signupBtn').addEventListener('click', async ()=>{
  suHint.textContent = '';
  const nick = normNick(suNickname.value);
  const pass = suPassword.value;

  if(!isValidNick(nick)){ suHint.textContent = '닉네임은 영문/숫자 3~20자입니다.'; return; }
  if(pass.length < 8){   suHint.textContent = '패스워드는 8자 이상 입력해 주세요.'; return; }

  try{
    // 닉네임 중복 체크
    const nickRef = doc(db, NICK_COLLECTION, nick);
    const nickSnap= await getDoc(nickRef);
    if(nickSnap.exists()){ suHint.textContent = '이미 사용 중인 닉네임입니다.'; return; }

    // 계정 생성
    const cred = await createUserWithEmailAndPassword(auth, emailFromNick(nick), pass);

    // 매핑 & 프로필 저장
    await setDoc(nickRef, { uid: cred.user.uid, createdAt: serverTimestamp() });
    await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), { nickname: nick, createdAt: serverTimestamp() });

    alert('가입 완료! 이제 로그인해 주세요.');
    location.reload(); // 초기화면으로
  }catch(e){
    console.error(e);
    suHint.textContent = '가입 중 오류가 발생했습니다.';
  }
});

/* 로그인 */
$('loginBtn').addEventListener('click', async ()=>{
  liHint.textContent = '';
  const nick = normNick(liNickname.value);
  const pass = liPassword.value;

  if(!nick){ liHint.textContent = '닉네임을 입력해 주세요.'; return; }
  if(!pass){ liHint.textContent = '패스워드를 입력해 주세요.'; return; }

  try{
    // (UX) 닉네임 존재 확인
    const nickSnap = await getDoc(doc(db, NICK_COLLECTION, nick));
    if(!nickSnap.exists()){ liHint.textContent = '등록되지 않은 닉네임입니다. 먼저 가입해 주세요.'; return; }

    // 로그인
    await signInWithEmailAndPassword(auth, emailFromNick(nick), pass);

    // 성공 → 메인 화면으로 이동
    location.href = './home.html';
  }catch(e){
    console.error(e);
    liHint.textContent = '로그인 실패: 닉네임 또는 패스워드가 올바르지 않습니다.';
  }
});

/* 엔터키 제출 */
[suNickname, suPassword].forEach(el => el.addEventListener('keydown', e => { if(e.key==='Enter') $('signupBtn').click(); }));
[liNickname, liPassword].forEach(el => el.addEventListener('keydown', e => { if(e.key==='Enter') $('loginBtn').click(); }));
