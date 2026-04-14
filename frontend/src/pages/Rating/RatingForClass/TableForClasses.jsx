import React from 'react'

import oneSt from '../../../assets/svgs/forPages/1st.svg'
import twoSt from '../../../assets/svgs/forPages/2nd.svg'
import threeSt from '../../../assets/svgs/forPages/3st.svg'

import styles from './RatingForClass.module.css' // Импортируйте стили

const TableForClasses = ({ users, currentPage }) => {
  const USERS_PER_PAGE = 10 // Установлено количество пользователей на странице

  const getCurrentUsers = () => {
    return users.map((user, index) => {
      // Правильный расчет ранга
      const rank = (currentPage - 1) * USERS_PER_PAGE + index + 1

      return (
        <tr key={index} className={index % 2 === 0 ? 'light-row' : 'dark-row'}>
          <td>
            {rank === 1 && (
              <img src={oneSt} alt="Gold Medal" className={styles.medal} />
            )}
            {rank === 2 && (
              <img src={twoSt} alt="Silver Medal" className={styles.medal} />
            )}
            {rank === 3 && (
              <img src={threeSt} alt="Bronze Medal" className={styles.medal} />
            )}
            {rank > 3 && <span>{rank}</span>}
          </td>
          <td>{user.name}</td>
          <td>{user.bonusPoints}</td>
          <td>{user.hoursInStation}</td>
        </tr>
      )
    })
  }

  return (
    <table id="user-table" className="table">
      <thead>
        <tr>
          <th>Место</th>
          <th>ФИО</th>
          <th>Кол-во бонусов</th>
          <th>Кол-во часов в станции</th>
        </tr>
      </thead>
      <tbody>{getCurrentUsers()}</tbody>
    </table>
  )
}

export default TableForClasses
