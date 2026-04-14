import React, { useEffect, useState } from "react";
import styles from "./Contacts.module.css";
import Pagination from "../../components/Pagination/Pagination";
import axios from "axios";

const USERS_PER_PAGE = 12; // Number of users per page

function Contacts() {
  const [dataTable, setDataTable] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await axios.get(
        "https://jsonplaceholder.typicode.com/users",
      );
      const users = response.data.map((user, index) => ({
        id: user.id,
        name: `${user.name} Ю.Ю.`, // Example format for ФИО
        responsiblePersons: [
          "Строков И.И", // Sample responsible person
          "Малыхина И.И",
        ],
        phoneNumber: `+7 (999) 000-00-00`, // Simulated phone number; adjust as needed
      }));

      // Create extendedUsers with unique IDs
      const extendedUsers = [];
      for (let i = 0; i < 3; i++) {
        users.forEach((user) => {
          // Create a new user object with a new ID
          extendedUsers.push({
            id: extendedUsers.length + 1, // New unique ID
            name: user.name,
            responsiblePersons: user.responsiblePersons,
            phoneNumber: user.phoneNumber,
          });
        });
      }

      setDataTable(extendedUsers.slice(0, 36)); // Ensure exactly 36 users to work with
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
      <h2 className={styles.stationInfo}>Контакты</h2>
      <div className="container">
        <h2 className="table-h2">Контакты</h2>
        <div className="row">
          <div className="col">
            <table id="user-table" className="table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>ФИО</th>
                  <th>Ответственные лица</th>
                  <th>Номер телефона</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentUsers().map((user, index) => (
                  <tr
                    key={user.id}
                    className={index % 2 === 0 ? "light-row" : "dark-row"}
                  >
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>
                      {user.responsiblePersons.map((person, idx) => (
                        <div key={idx}>{person}</div>
                      ))}
                    </td>
                    <td>{user.phoneNumber}</td>{" "}
                    {/* Using the simulated phone number */}
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

export default Contacts;
