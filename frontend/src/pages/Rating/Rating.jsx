import React, { useState } from 'react'
import useSound from 'use-sound'
import soundClickForButtons from '../../assets/mp3/soundClickForButtons.mp3'
import { Outlet, useNavigate } from 'react-router-dom'
import RatingForSchool from './RatingForSchool/RatingForSchool'
import styles from './Rating.module.css'

function Rating() {
  const [click] = useSound(soundClickForButtons)
  const [showRating, setShowRating] = useState(true)
  const navigate = useNavigate()

  const handleClickOnSchool = () => {
    setShowRating(true)
    navigate('/rating/school')
  }
  const handleClickOnClass = () => {
    setShowRating(false)
    navigate('/rating/classes')
  }
  return (
    <div>
      <h2 className="station-info">Рейтинг</h2>
      <div className="container">
        <div className={styles.topTable}>
          <h2 className="table-h2">
            Рейтинг учеников по {showRating ? 'школе' : 'классам'}
          </h2>
          <div>
            <button
              className={showRating ? styles.active : styles.inactive}
              onClick={() => {
                click()
                handleClickOnSchool()
              }}
            >
              По школе
            </button>
            <button
              className={!showRating ? styles.active : styles.inactive}
              onClick={() => {
                click()
                handleClickOnClass()
              }}
            >
              По классам
            </button>
          </div>
        </div>

        {showRating ? (
          <RatingForSchool />
        ) : (
          <Outlet /> // Здесь будет отображаться содержимое выбранного маршрута
        )}
      </div>
    </div>
  )
}

export default Rating
