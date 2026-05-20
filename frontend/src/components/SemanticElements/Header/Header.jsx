import notification from "../../../assets/svgs/forTemplate/notification.svg";
import help from "../../../assets/svgs/forTemplate/help.svg";
import account from "../../../assets/svgs/forTemplate/account.svg";
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../assets/svgs/forTemplate/logo.svg";
import "./Header.css";
import humburger from "../../../assets/svgs/forTemplate/humburger.svg";
import { useAuth } from "../../../context/AuthContext";

function Header({ toggleNav }) {
  const { user, logout } = useAuth();

  const accountTitle = user
    ? `${user.last_name} ${user.first_name} ${user.patronymic}`
    : "Аккаунт";

  const userShortName = React.useMemo(() => {
    if (!user) return "";
    const ln = (user.last_name || "").trim();
    const fn = (user.first_name || "").trim();
    const pn = (user.patronymic || "").trim();
    const fi = fn ? `${fn[0].toUpperCase()}.` : "";
    const pi = pn ? `${pn[0].toUpperCase()}.` : "";
    const initials = `${fi}${pi}`.trim();
    return initials ? `${ln} ${initials}`.trim() : ln;
  }, [user]);

  return (
    <div className="header">
      <div className="header-top">
        <div className="logo-block">
          <div className="hamburger-menu" onClick={toggleNav}>
            <img src={humburger} alt="Меню" />
          </div>
          <a href="/">
            <img src={logo} alt="Логотип" />
          </a>
          <h1>СДБИЗ</h1>
        </div>
        <div className="search">
          <input placeholder="Поиск..." />
        </div>
        <div className="header-right-block">
          <ul className="right-block">
            <li>
              <Link to="#home">
                <img src={help} alt="Помощь" />
              </Link>
            </li>
            <li>
              <Link to="#home">
                <img src={notification} alt="Уведомления" />
              </Link>
            </li>
            <li className="header-account-li">
              <Link to={user ? "/profile" : "/login"} title={accountTitle}>
                <img src={account} alt="Аккаунт" />
              </Link>
              <div className="account-information">
                {user ? (
                  <>
                    <p className="account-information-1">{user.username}</p>
                    <p className="account-information-2 account-fio" title={accountTitle}>
                      {userShortName}
                    </p>
                    <button
                      type="button"
                      className="header-logout"
                      onClick={logout}
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="account-auth-link">
                      Войти
                    </Link>
                    <Link to="/register" className="account-auth-link muted">
                      Регистрация
                    </Link>
                  </>
                )}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Header;




