import React from 'react'
import { Link } from 'react-router-dom'
import styles from './ClassSelection.module.css'
import useSound from 'use-sound'
import soundClickForClasses from '../../../assets/mp3/soundClickForClasses.mp3'
const ClassSelection = () => {
  const [click] = useSound(soundClickForClasses)
  const classes = Array.from({ length: 11 }, (v, i) => i + 1)

  return (
    <div>
      <h3 style={{ fontSize: '20px', padding: '10px 0' }}>
        Выберите класс для просмотра рейтинга
      </h3>
      <ul className={styles.list}>
        {classes.map((classId) => (
          <li key={classId}>
            <Link
              to={`/rating/classes/${classId}`}
              className={styles.link}
              onClick={click}
            >
              Класс {classId}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ClassSelection
