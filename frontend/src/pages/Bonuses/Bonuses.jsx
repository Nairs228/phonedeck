import React, { useState } from 'react'
import useSound from 'use-sound'
import soundClickForButtons from '../../assets/mp3/soundClickForButtons.mp3'
import styles from './Bonuses.module.css'
import YourBonuses from './YourBonuses/YourBonuses'
import HistoryBonuses from './HistoryBonuses/HistoryBonuses'

function Bonuses() {
  const [click] = useSound(soundClickForButtons)
  // State to manage which section is visible
  const [showBonuses, setShowBonuses] = useState(true)

  // Function to handle click on "Ваши бонусы" button
  const handleBonusesClick = () => {
    setShowBonuses(true)
  }

  // Function to handle click on "История" button
  const handleHistoryClick = () => {
    setShowBonuses(false)
  }

  return (
    <div className={styles.Bonuses}>
      <div>
        <div className={styles.articlesButtons}>
          <div>
            <h2 className="station-info">Страница бонусов</h2>
            <p className={styles.timeToBonus}>60 минут = 1 бонус</p>
          </div>
          <div className={styles.buttons}>
            <button
              className={showBonuses ? styles.active : styles.inactive}
              onClick={() => {
                handleBonusesClick()
                click()
              }}
            >
              Ваши бонусы
            </button>
            <button
              className={!showBonuses ? styles.active : styles.inactive}
              onClick={() => {
                handleHistoryClick()
                click()
              }}
            >
              История
            </button>
          </div>
        </div>

        {showBonuses ? (
          <div>
            <YourBonuses />
          </div>
        ) : (
          <div>
            <HistoryBonuses />
          </div>
        )}
      </div>
    </div>
  )
}

export default Bonuses
