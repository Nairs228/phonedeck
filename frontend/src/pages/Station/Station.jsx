import React, { useEffect, useState } from "react";
import Pagination from "../../components/Pagination/Pagination";
import axios from "axios";
import styles from "./Station.module.css";

const USERS_PER_PAGE = 12;

// Helper function to convert numbers to ordinal words
const getOrdinalStationName = (num) => {
  const names = [
    "",
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
    "Eleventh",
    "Twelfth",
    "Thirteenth",
    "Fourteenth",
    "Fifteenth",
    "Sixteenth",
    "Seventeenth",
    "Eighteenth",
    "Nineteenth",
    "Twentieth",
    "Twenty First",
    "Twenty Second",
    "Twenty Third",
    "Twenty Fourth",
    "Twenty Fifth",
    "Twenty Sixth",
    "Twenty Seventh",
    "Twenty Eighth",
    "Twenty Ninth",
    "Thirtieth",
  ];
  return names[num] || `Station ${num}`; // Fallback if out of range
};

function Station() {
  const [dataTable, setDataTable] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await axios.get(
        "https://jsonplaceholder.typicode.com/users",
      );

      // Generate 30 stations
      const users = new Array(30).fill(null).map((_, index) => {
        // Simulate station activity
        const activityType = Math.random();
        let activity, currentPhones, usageHours;

        if (activityType < 0.5) {
          activity = "Работает";
          currentPhones = Math.floor(Math.random() * 10) + 1; // Random phones > 0
          usageHours = Math.floor(Math.random() * 100); // Random hours
        } else if (activityType < 0.8) {
          activity = "Тех обслуживание";
          currentPhones = 0;
          usageHours = 0;
        } else {
          activity = "Не работает";
          currentPhones = 0;
          usageHours = 0;
        }

        return {
          name: `Пользователь Ю.Ю.`, // Simulated name
          stationName: getOrdinalStationName(index + 1), // Station name
          currentPhones,
          usageHours,
          activity,
        };
      });

      // Set data table with generated stations
      setDataTable(users);
    };

    fetchUsers();
  }, []);

  // Pagination
  const totalUsers = dataTable.length; // Total number of users
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE); // Calculate total pages

  // Get users for the current page
  const getCurrentUsers = () => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return dataTable.slice(start, start + USERS_PER_PAGE);
  };

  return (
    <div>
      <h2 className="station-info">Станции</h2>
      <div className="container">
        <h2 className="table-h2">Информация об станциях</h2>
        <div className="row">
          <div className="col">
            <table id="user-table" className="table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Станция</th>
                  <th>Текущее кол-во телефонов</th>
                  <th>Время использования в часах</th>
                  <th>Активность</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentUsers().map((user, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "light-row" : "dark-row"}
                  >
                    <td>
                      <span>
                        {(currentPage - 1) * USERS_PER_PAGE + index + 1}
                      </span>
                    </td>
                    <td>
                      <strong>{user.stationName}</strong>{" "}
                      {/* Bold station name */}
                    </td>
                    <td>{user.currentPhones}</td>
                    <td>{user.usageHours}</td>
                    <td
                      style={{
                        color:
                          user.activity === "Работает"
                            ? "#42BA66"
                            : user.activity === "Тех обслуживание"
                              ? "#FF9D00"
                              : "#EA3030",
                      }}
                    >
                      {user.activity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Station;
