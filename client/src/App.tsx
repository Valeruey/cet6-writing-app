import { Routes, Route } from "react-router-dom";
import Shell from "./components/layout/Shell";
import HomePage from "./pages/HomePage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleReaderPage from "./pages/ArticleReaderPage";
import PracticePage from "./pages/PracticePage";
import HistoryPage from "./pages/HistoryPage";
import SavedExpressionsPage from "./pages/SavedExpressionsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:id" element={<ArticleReaderPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/saved" element={<SavedExpressionsPage />} />
      </Route>
    </Routes>
  );
}
