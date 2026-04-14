import React from "react";
import styles from "./ViewPage.module.css";
import phone from "../../assets/svgs/forPages/phone.svg";
import line from "../../assets/svgs/forPages/line.svg";
import MorrisChart from "../../components/MorrisChart/MorrisChart";
import UserTable from "../../components/UserTable/UserTable";
function ViewPage() {
  return (
    <div className={styles.ViewPage}>
      <h2 className="station-info">
        Станция для борьбы с информационной зависимостью
      </h2>
      <p className={styles.welcome}>Добро пожаловать</p>

      <div className={styles.whiteBlock}>
        <div className={styles.whiteBlockInf}>
          <h3 className={styles.whiteBlockH3}>999</h3>
          <p className={styles.whiteBlockP}>Телефонов внутри</p>
          <img className={styles.whiteBlockImg} src={line}></img>
        </div>
        <div className={styles.whiteBlockPhone}>
          <img src={phone}></img>
          <p className={styles.whiteBlockPersent}>67%</p>
        </div>
      </div>
      <MorrisChart></MorrisChart>
      <UserTable></UserTable>
    </div>
  );
}

export default ViewPage;
