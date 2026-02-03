/**
 * App: 画面の状態（state）と Firestore の橋渡し
 *
 * 【state の役割】
 * - 画面上の「今表示しているタスク一覧」を保持する（UI は常にこの state を元に描画）
 * - ユーザー操作に応じてすぐ UI を更新するため、ローカルで一時的に持つ
 *
 * 【Firestore の役割】
 * - データの永続化（リロードしても消えない）。正として扱い、追加・取得・削除はすべて Firestore 経由
 * - 操作完了後に getTodos() で再取得し、setTasks で state を更新する
 *
 * 【自動更新（リロード）でも消えない理由】
 * - 初回マウント時およびリロード時に useEffect で getTodos() を実行し、Firestore から取得した内容で setTasks する
 * - 表示は常に state を元にするため、Firestore 取得完了後の state で安定する
 *
 * 【表示ズレの原因（Firestore 対応後に起きていたこと）】
 * 1. 並び順: getTodos() は orderBy なしで取得するため、Firestore の返却順は保証されない。
 * 2. 表示タイミング: 追加後に setInputValue('') を先に実行すると、一覧の再取得が終わる前に入力欄だけ空になりズレる。
 */
import React, { useState, useEffect } from 'react';
import { addTodo, getTodos, deleteTodo } from './services/firestore';
import TodoList from './components/TodoList';

/** リストの初期状態を「デフォルト」に固定する。本アプリはこの1リストのみを使用する */
const DEFAULT_LIST_LABEL = 'デフォルト';

function App() {
  // 初期 state の設計意図:
  // - tasks: [] … 表示するタスク一覧。Firestore 取得前に空、取得後に setTasks で上書き
  // - inputValue: '' … 入力欄。追加後に空に戻す
  // - loading: true … 初回は「読み込み中」表示。loadTodos の finally で false に
  // - error: null … エラー時のみメッセージを表示
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Firestore から一覧を取得し、state を更新する。
   * 並び順を安定させるため、取得後に createdAt の新しい順でソートしてから setTasks する。
   */
  const loadTodos = async () => {
    try {
      setError(null);
      const list = await getTodos();
      // 並び順を安定させる: createdAt の新しい順（ローカル版と同じ「新規が上」）
      const sorted = [...list].sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ?? 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ?? 0);
        return tB - tA;
      });
      setTasks(sorted);
    } catch (e) {
      setError('タスクの取得に失敗しました: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時およびリロード時に Firestore から取得する。依存配列が空なのでマウント時のみ実行。
  // リロードしてもこの useEffect が走るため、getTodos() → setTasks でタスクが復元され消えない。
  useEffect(() => {
    loadTodos();
  }, []);

  // タスク追加: add → Firestore 保存 → 再取得 → setState の流れを await で保証する。
  // 1. await addTodo(title) で Firestore に保存完了を待つ
  // 2. await loadTodos() で再取得し setTasks が完了するまで待つ
  // 3. その後に setInputValue('') で入力欄を空にする（表示のズレを防ぐ）
  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;
    try {
      setError(null);
      await addTodo(title);
      await loadTodos();
      setInputValue('');
    } catch (e) {
      setError('タスクの追加に失敗しました: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError(null);
      await deleteTodo(id);
      await loadTodos();
    } catch (e) {
      setError('タスクの削除に失敗しました: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>ToDoアプリ (React + Firestore)</h1>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>リスト: {DEFAULT_LIST_LABEL}</p>
      {error && <p style={{ color: '#c33' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="新しいタスク"
          aria-label="新しいタスクの入力"
        />
        <button type="submit">追加</button>
      </form>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <TodoList tasks={tasks} onDelete={handleDelete} />
      )}
    </div>
  );
}

export default App;
