/**
 * App: 全体の状態保持と Firestore 連携
 * VERIFICATION.md の確認項目（タスク追加・完了・編集・リスト・リロード等）に沿った構成
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  getLists,
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  addList,
  deleteList,
} from './services/firestore';
import { computeCounts, sortTasksByCreatedAt } from './utils/taskUtils';
import {
  DEFAULT_LIST_NAME,
  PROMPT_NEW_LIST_NAME,
  ALERT_CANNOT_DELETE_DEFAULT_LIST,
  CONFIRM_DELETE_LIST,
  ERROR_LOAD_FAILED,
  ERROR_LIST_NOT_READY,
  ERROR_TASKS_FETCH,
  ERROR_TASKS_ADD,
  ERROR_TASKS_UPDATE,
  ERROR_TASKS_DELETE,
  ERROR_LISTS_FETCH,
  ERROR_LISTS_ADD,
  ERROR_LISTS_DELETE,
} from './constants/messages';
import Counter from './components/Counter';
import ListSelector from './components/ListSelector';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

function App() {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [currentListId, setCurrentListId] = useState('');
  const [error, setError] = useState(null);

  const defaultListId = lists.find((l) => l.name === DEFAULT_LIST_NAME)?.id ?? lists[0]?.id ?? '';

  const loadTasks = useCallback(
    (defaultListIdParam) => {
      const fallback = defaultListIdParam ?? defaultListId;
      setError(null);
      return getTasks(fallback)
        .then((list) => setTasks(sortTasksByCreatedAt(list)))
        .catch((e) => setError(ERROR_TASKS_FETCH + ': ' + e.message));
    },
    [defaultListId]
  );

  const loadLists = useCallback(() => {
    setError(null);
    return getLists()
      .then((data) => {
        setLists(data);
        return data;
      })
      .catch((e) => {
        setError(ERROR_LISTS_FETCH + ': ' + e.message);
        return [];
      });
  }, []);

  // 初回: リスト・タスクを取得。VERIFICATION「初回表示でマイリストが1件ある」を満たすため、
  // リストが0件または「マイリスト」が無い場合は自動作成し、先頭に置く
  useEffect(() => {
    setError(null);
    getLists()
      .then((listData) => {
        if (!Array.isArray(listData)) listData = [];
        const hasDefaultList = listData.some((l) => l.name === DEFAULT_LIST_NAME);
        if (listData.length === 0 || !hasDefaultList) {
          return addList(DEFAULT_LIST_NAME).then((created) => {
            const defaultEntry = { id: created.id, name: created.name };
            return listData.length === 0 ? [defaultEntry] : [defaultEntry, ...listData];
          });
        }
        return listData;
      })
      .then((listData) => {
        setLists(listData);
        const firstId = listData[0]?.id ?? '';
        setCurrentListId(firstId);
        return getTasks(firstId);
      })
      .then((taskList) => setTasks(sortTasksByCreatedAt(taskList)))
      .catch((e) => setError(ERROR_LOAD_FAILED + ': ' + e.message));
  }, []);

  const handleAddTask = (title) => {
    const listId = currentListId || defaultListId;
    if (!listId) {
      setError(ERROR_LIST_NOT_READY);
      return;
    }
    setError(null);
    addTask({
      title,
      list_id: listId,
      is_completed: false,
      is_favorite: false,
      due_date: null,
      memo: '',
      time: 0,
    })
      .then(() => loadTasks(listId))
      .catch((e) => setError(ERROR_TASKS_ADD + ': ' + e.message));
  };

  const handleUpdateTask = (id, data) => {
    const listId = currentListId || defaultListId;
    setError(null);
    updateTask(id, data)
      .then(() => loadTasks(listId))
      .catch((e) => setError(ERROR_TASKS_UPDATE + ': ' + e.message));
  };

  const handleDeleteTask = (id) => {
    const listId = currentListId || defaultListId;
    setError(null);
    deleteTask(id)
      .then(() => loadTasks(listId))
      .catch((e) => setError(ERROR_TASKS_DELETE + ': ' + e.message));
  };

  const handleAddList = () => {
    const name = window.prompt(PROMPT_NEW_LIST_NAME);
    if (!name?.trim()) return;
    setError(null);
    addList(name.trim())
      .then((created) => loadLists().then(() => setCurrentListId(created.id)))
      .catch((e) => setError(ERROR_LISTS_ADD + ': ' + e.message));
  };

  const handleDeleteList = () => {
    if (currentListId === defaultListId) {
      window.alert(ALERT_CANNOT_DELETE_DEFAULT_LIST);
      return;
    }
    if (!window.confirm(CONFIRM_DELETE_LIST)) return;
    setError(null);
    deleteList(currentListId, defaultListId)
      .then(() => loadLists())
      .then(() => loadTasks(defaultListId))
      .then(() => setCurrentListId(defaultListId))
      .catch((e) => setError(ERROR_LISTS_DELETE + ': ' + e.message));
  };

  const counts = computeCounts(tasks);

  return (
    <div className="app-container">
      <h1>ToDoアプリ</h1>
      {error && <p className="app-error">{error}</p>}
      <Counter counts={counts} />
      <ListSelector
        lists={lists}
        currentListId={currentListId}
        defaultListId={defaultListId}
        onSelect={setCurrentListId}
        onAdd={handleAddList}
        onDelete={handleDeleteList}
      />
      <TaskForm onAdd={handleAddTask} disabled={!currentListId} />
      <TaskList
        tasks={tasks}
        currentListId={currentListId}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

export default App;
