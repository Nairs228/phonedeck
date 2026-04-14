import React from "react";
import { useLocation } from "react-router-dom";
import "./NotFound.css";
function NotFound() {
  const location = useLocation(); // Получаем текущий путь

  return (
    <div>
      <h2 className="notFound">Страница не найдена</h2>
      <p className="notFound">
        Запрашиваемая страница <strong>{location.pathname}</strong> не
        существует.
      </p>
    </div>
  );
}

export default NotFound;
