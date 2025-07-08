// Firebase 설정
const firebaseConfig = {
    apiKey: "여기에-Firebase-콘솔에서-받은-apiKey-입력",
    authDomain: "프로젝트ID.firebaseapp.com",
    projectId: "프로젝트ID",
    storageBucket: "프로젝트ID.appspot.com",
    messagingSenderId: "메시징ID",
    appId: "앱ID"
};

// Firebase 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firebase 서비스
const auth = firebase.auth();
const db = firebase.firestore();

// 로깅 활성화
const enableLogging = true;

// Firebase 로깅 함수
function logToFirebase(action, data, error = null) {
    if (!enableLogging) return;

    const logData = {
        action,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous',
        data,
    };

    if (error) {
        logData.error = {
            code: error.code,
            message: error.message
        };
    }

    // 로그 저장
    db.collection('logs').add(logData)
        .then(() => console.log('Log saved:', action))
        .catch(err => console.error('Log save failed:', err));
}

// Auth 상태 변경 로깅
auth.onAuthStateChanged((user) => {
    logToFirebase('auth_state_changed', {
        isLoggedIn: !!user,
        email: user?.email
    });
});

// Firestore 설정
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true // undefined 필드 무시
});

// 오프라인 지원 활성화
db.enablePersistence()
    .catch((err) => {
        console.error('Firestore persistence error:', err);
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support persistence.');
        }
    });

// 데이터베이스 연결 테스트
async function testDatabaseConnection() {
    try {
        // 테스트 문서 작성 시도
        const testRef = db.collection('_test_connection').doc('test');
        await testRef.set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Firestore connection successful!');
        // 테스트 문서 삭제
        await testRef.delete();
    } catch (error) {
        console.error('Firestore connection failed:', error);
        alert('데이터베이스 연결에 실패했습니다. 관리자에게 문의하세요.');
    }
}

// 초기 연결 테스트 실행
testDatabaseConnection();

// 사용자 데이터 초기화 함수
async function initializeUserData(userId) {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            // 새 사용자의 초기 데이터 구조 생성
            await userRef.set({
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                inventory: {},
                settings: {
                    notifications: true,
                    theme: 'light'
                }
            });
            console.log('User data initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

// Auth 상태 변경 감지
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('User signed in:', user.uid);
        await initializeUserData(user.uid);
    } else {
        console.log('User signed out');
    }
});

// 전역으로 내보내기
export { 
    auth, 
    db,
    logToFirebase,  // 로깅 함수 내보내기
    initializeUserData
}; 