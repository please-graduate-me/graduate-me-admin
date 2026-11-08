import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/globals.css';

const root = document.getElementById('root');

if (!root) throw new Error('관리자 앱의 루트 요소를 찾을 수 없습니다.');

createRoot(root).render(<App />);
