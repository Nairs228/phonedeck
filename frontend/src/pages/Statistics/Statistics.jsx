import styles from "./Statistics.module.css";
import React, { useEffect, useState } from "react";
import Pagination from "../../components/Pagination/Pagination";
import axios from "axios";

const USERS_PER_PAGE = 12;

function Statistics() {
  const [dataTable, setDataTable] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await axios.get(
        "https://jsonplaceholder.typicode.com/users",
      );
      const users = response.data.map(() => {
        // Generate accumulated bonus points
        const accumulatedBonusPoints = Math.floor(Math.random() * 100);
        // Generate spent bonus points ensuring it doesn't exceed accumulated
        const spentBonusPoints = Math.floor(
          Math.random() * (accumulatedBonusPoints + 1),
        );

        return {
          name: `Пользователь Ю.Ю.`, // Simulated name
          responsiblePersons: ["Строков И.И", "Малыхина И.И"],
          phoneNumber: `+7 (999) 000-00-00`, // Simulated phone number
          bonusPoints: accumulatedBonusPoints, // Simulated accumulated bonus points
          spentPoints: spentBonusPoints, // Simulated spent bonus points
          hoursInStation: Math.floor(Math.random() * 100), // Simulated station hours
        };
      });

      // Create extended users
      const extendedUsers = [];
      for (let i = 0; i < 3; i++) {
        users.forEach((user) => {
          extendedUsers.push({
            name: user.name,
            responsiblePersons: user.responsiblePersons,
            phoneNumber: user.phoneNumber,
            bonusPoints: user.bonusPoints,
            spentPoints: user.spentPoints, // Include spent points
            hoursInStation: user.hoursInStation,
          });
        });
      }

      // Set the data table with the first 36 entries
      setDataTable(extendedUsers.slice(0, 36));
    };

    fetchUsers();
  }, []);

  // Sort users by accumulated bonus points in descending order
  const sortedUsers = [...dataTable].sort(
    (a, b) => b.bonusPoints - a.bonusPoints,
  );

  // Pagination
  const totalUsers = sortedUsers.length; // Total number of users
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE); // Calculate total pages

  // Get users for the current page
  const getCurrentUsers = () => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return sortedUsers.slice(start, start + USERS_PER_PAGE);
  };

  return (
    <div>
      <h2 className="station-info">Статистика</h2>
      <div className="container">
        <h2 className="table-h2">Информация об учениках</h2>
        <div className="row">
          <div className="col">
            <table id="user-table" className="table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>ФИО</th>
                  <th>Кол-во накопленных бонусов</th>
                  <th>Кол-во потраченных бонусов</th>
                  <th>Кол-во часов в станции</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentUsers().map((user, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "light-row" : "dark-row"}
                  >
                    <td>
                      {/* Display the sequential number */}
                      <span>
                        {(currentPage - 1) * USERS_PER_PAGE + index + 1}
                      </span>
                    </td>
                    <td>{user.name}</td>
                    <td>{user.bonusPoints}</td>
                    <td>{user.spentPoints}</td> {/* Display spent points */}
                    <td>{user.hoursInStation}</td>
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

export default Statistics;
