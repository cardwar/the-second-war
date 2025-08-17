// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 1) 본인 프로젝트 값으로 교체 (콘솔 > 프로젝트 설정 > 일반 > SDK 설정/구성) */
const firebaseConfig = {
  apiKey:        "YOUR_API_KEY",
  authDomain:    "YOUR_PROJECT.firebaseapp.com",
  projectId:     "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId:         "APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* 2) 헬퍼 */
const NICK_COLLECTION = "nicknames"; // /nicknames/{nicknameLower} -> { uid, createdAt }
const USERS_COLLECTION= "users";     // /users/{uid} -> { nickname, createdAt }
const domain = "nick.local";         // 가짜 이메일 도메인

const $ = id => document.getElementById(id);
const suNickname = $('suNickname');
const suPassword = $('suPassword');
const suHint     = $('suHint');
const liNickname = $('liNickname');
const liPassword = $('liPassword');
const liHint     = $('liHint');

function normNick(n){ return n.trim().toLowerCase().replace(/\s+/g,''); }
function isValidNick(n){ return /^[a-z0-9]{3,20}$/.test(n); }
function emailFromNick(n){ return `${n}@${domain}`; }

/* 3) 가입 */
$('signupBtn').addEventListener('click', async ()=>{
  suHint.textContent = '';
  const nickRaw = suNickname.value;
  const pass    = suPassword.value;

  const nick = normNick(nickRaw);
  if(!isValidNick(nick)){ suHint.textContent = '닉네임은 영문/숫자 3~20자입니다.'; return; }
  if(pass.length < 8){ suHint.textContent = '패스워드는 8자 이상 입력해 주세요.'; return; }

  try{
    // 닉네임 중복 체크
    const nickRef = doc(db, NICK_COLLECTION, nick);
    const nickSnap= await getDoc(nickRef);
    if(nickSnap.exists()){
      suHint.textContent = '이미 사용 중인 닉네임입니다.';
      return;
    }

    // Auth 계정 생성
    const email = emailFromNick(nick);
    const cred  = await createUserWithEmailAndPassword(auth, email, pass);

    // 닉네임 매핑 & 유저 프로필 저장
    await setDoc(nickRef, { uid: cred.user.uid, createdAt: serverTimestamp() });
    await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), { nickname: nick, createdAt: serverTimestamp() });

    // 완료 후 로그인 화면으로 안내 또는 자동 이동
    alert('가입 완료! 이제 로그인해 주세요.');
    location.reload(); // 단순히 초기 화면으로 복귀
  }catch(err){
    console.error(err);
    suHint.textContent = '가입 중 오류가 발생했습니다.';
  }
});

/* 4) 로그인 */
$('loginBtn').addEventListener('click', async ()=>{
  liHint.textContent = '';
  const nickRaw = liNickname.value;
  const pass    = liPassword.value;

  const nick = normNick(nickRaw);
  if(!nick){ liHint.textContent = '닉네임을 입력해 주세요.'; return; }
  if(!pass){ liHint.textContent = '패스워드를 입력해 주세요.'; return; }

  try{
    // 닉네임 존재 확인(옵션: 스킵 가능하지만 UX 좋음)
    const nickRef = doc(db, NICK_COLLECTION, nick);
    const nickSnap= await getDoc(nickRef);
    if(!nickSnap.exists()){
      liHint.textContent = '등록되지 않은 닉네임입니다. 먼저 가입해 주세요.';
      return;
    }

    // Auth 로그인
    const email = emailFromNick(nick);
    await signInWithEmailAndPassword(auth, email, pass);

    // 성공 → 게임 화면으로 이동
    location.href = './game.html';
  }catch(err){
    console.error(err);
    liHint.textContent = '로그인 실패: 닉네임 또는 패스워드가 올바르지 않습니다.';
  }
});

/* 5) 엔터키 제출 편의 */
[suNickname, suPassword].forEach(el=>{
  el.addEventListener('keydown', e => { if(e.key==='Enter') $('signupBtn').click(); });
});
[liNickname, liPassword].forEach(el=>{
  el.addEventListener('keydown', e => { if(e.key==='Enter') $('loginBtn').click(); });
});
