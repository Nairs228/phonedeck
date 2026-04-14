import React from 'react'
import styles from './SuccessModal.module.css' // You can style it here
import useSound from 'use-sound'
import soundClickForButtons from '../../../assets/mp3/soundClickForButtons.mp3'

const SuccessModal = ({ onClose }) => {
  const [click] = useSound(soundClickForButtons)

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.description}>Ура! Вы потратили бонусы!</h2>
        <button
          className={styles.modalButtons}
          onClick={() => {
            click()
            onClose()
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default SuccessModal
