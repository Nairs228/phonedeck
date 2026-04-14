import notification from "../../../assets/svgs/forTemplate/notification.svg";
import help from "../../../assets/svgs/forTemplate/help.svg";
import account from "../../../assets/svgs/forTemplate/account.svg";
import React from "react";
import { Link } from 'react-router-dom';
import logo from "../../../assets/svgs/forTemplate/logo.svg";
import "./Header.css";
import humburger from "../../../assets/svgs/forTemplate/humburger.svg";

function Header({ toggleNav }) {
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
            <li>
              <Link to="#home">
                <img src={account} alt="Аккаунт" />
              </Link>
              <div className="account-information">
                <p className="account-information-1">user</p>
                <p className="account-information-2">Admin</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Header;




