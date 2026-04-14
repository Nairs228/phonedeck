import React from 'react'
import styles from './ConfirmationModal.module.css'
import useSound from 'use-sound'
import soundClickForButtons from '../../../assets/mp3/soundClickForButtons.mp3'

const ConfirmationModal = ({ onClose, onConfirm }) => {
  const [click] = useSound(soundClickForButtons)
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.description}>Вы уверены?</h2>
        <div className={styles.modalButtons}>
          <button
            onClick={() => {
              click()
              onConfirm()
            }}
          >
            Да
          </button>
          <button
            onClick={() => {
              click()
              onClose()
            }}
          >
            Нет
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
