import React, { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import styles from "./MorrisChart.module.css"
import {
  Chart as ChartJS,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js"

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale)

const MorrisChart = () => {
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    fetch("/get_data")
      .then((response) => response.json())
      .then((data) => {
        const timeCounts = {}

        data.forEach(({ connection_time }) => {
          const hour = connection_time.split(":")[0] + ":00"
          timeCounts[hour] = (timeCounts[hour] || 0) + 1
        })

        const labels = Object.keys(timeCounts).sort()
        const values = labels.map((hour) => timeCounts[hour])

        setChartData({
          labels,
          datasets: [
            {
              label: "Количество подключений",
              data: values,
              backgroundColor: "#E383EC",
              borderColor: "gray",
              borderWidth: 1,
            },
          ],
        })
      })
      .catch((error) => console.error("Ошибка загрузки данных:", error))
  }, [])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  }

  return (
    <div className={styles.morrisChart}>
      {chartData ? (
        <Bar data={chartData} options={options} />
      ) : (
        <p>Загрузка...</p>
      )}
    </div>
  )
}

export default MorrisChart
