/**
 * Firestore 処理（Create + Realtime Read）
 *
 * 【データの永続化】
 * - 追加した ToDo は Firestore（クラウドDB）に保存される
 * - リロード・タブを閉じてもデータは消えない
 * - 次にページを開いたとき、subscribeTodos が Firestore から取得して表示する
 */
import {
  collection,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

// コレクション名を定数で管理（typo 防止）
const COLLECTION_NAME = 'todos';

/**
 * Create: 新規 ToDo を Firestore に追加
 *
 * @param {string} title - ToDo のタイトル
 * @returns {Promise<string>} 追加されたドキュメントの ID
 */
export async function addTodoToDB(title) {
  const todosRef = collection(db, COLLECTION_NAME);

  // addDoc は Promise を返すので await で待つ
  const docRef = await addDoc(todosRef, {
    title: title,
    createdAt: new Date(),
  });

  return docRef.id;
}

/**
 * Realtime Read: todos コレクションをリアルタイム監視
 *
 * 【onSnapshot の仕組み】
 * - Firestore に「このコレクションを監視して」と登録する
 * - 初回: 即座に現在のデータを callback に渡す（ページ表示時に Firestore から取得）
 * - 以降: 誰かが追加・変更・削除するたびに、自動で callback が呼ばれる
 * - 同じアプリを別タブで開いている場合も、そのタブの callback が呼ばれる
 * → 「別タブで追加 → 即反映」が実現する
 *
 * 【なぜ await が不要か】
 * onSnapshot は Promise を返さず、同期的に unsubscribe 関数を返す。
 * データ取得はコールバックで非同期に届くため、await する対象がない。
 *
 * @param {function(todos: Array<{id, title, createdAt}>): void} callback - 成功時
 * @param {function(error: Error): void} [onError] - エラー時（任意）
 * @returns {function} unsubscribe - useEffect の cleanup で呼ぶ
 */
export function subscribeTodos(callback, onError) {
  const todosRef = collection(db, COLLECTION_NAME);

  // orderBy を使わず単純にコレクションを取得（インデックス不要で確実に動作）
  // ソートは取得後にクライアント側で実施
  const unsubscribe = onSnapshot(
    todosRef,
    (querySnapshot) => {
      const todos = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        todos.push({
          id: doc.id,
          title: data.title || '',
          createdAt: data.createdAt?.toDate?.() || new Date(0),
        });
      });
      // クライアント側で createdAt の降順（新しい順）にソート
      todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(todos);
    },
    (err) => {
      console.error('Firestore 監視エラー:', err);
      if (onError) onError(err);
      callback([]);
    }
  );

  return unsubscribe;
}
