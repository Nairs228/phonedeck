import styles from "./Pagination.module.css"
import useSound from "use-sound"
import soundClick from "../../assets/mp3/soundClick.mp3"

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  const pages = []

  // Логика отображения страниц
  if (totalPages <= 5) {
    // Если страниц меньше или равно 5, показываем все
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Если страниц больше 5, показываем первую и последнюю страницы
    pages.push(1)

    if (currentPage <= 3) {
      // Если текущая страница в начале
      pages.push(2, 3, 4, "...", totalPages)
    } else if (currentPage >= totalPages - 2) {
      // Если текущая страница в конце
      pages.push(
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      )
    } else {
      // Если текущая страница в середине
      pages.push(
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      )
    }
  }

  const [play] = useSound(soundClick)

  return (
    <nav>
      <ul className={styles.pagination}>
        {pages.map((page, index) => (
          <li
            key={index}
            className={`${styles.pageItem} ${currentPage === page ? `${styles.active}` : ""}`}
            onClick={() => {
              if (page !== "...") {
                onPageChange(page)
                play()
              }
            }}
          >
            <span className={styles.pageLink}>{page}</span>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Pagination
