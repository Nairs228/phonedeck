import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
function Footer() {
  return (
    <div className="footer">
      <h3 className="footer-h3">СДБИЗ</h3>
      <p className="footer-want">Хотите узнать больше?</p>
      <Link to="#">
        <p className="footer-together">Связаться с нами</p>
      </Link>
      <h4 className="copyright">
        Copyright © Moscow Polytechnic University 2024
      </h4>
    </div>
  );
}

export default Footer;
