import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

import { IoMdSettings } from "react-icons/io";
import { IoIosSearch } from "react-icons/io";
import { IoExitOutline } from "react-icons/io5";



import sun from '../../assets/sun.svg';
import moon from '../../assets/moon.svg';


const AdminNavbar: React.FC = () => {
  const { logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const navigate = useNavigate();


  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setIsDarkMode((prev: any) => !prev);
  };

  return (
    <header className="flex justify-between p-4 items-center bg-white dark:bg-[#0f1221] transition-colors duration-300">
      <div
        onClick={() => navigate('/')}
        className="text-2xl font-extrabold text-[#D946EF] dark:text-[#E879F9] cursor-pointer"
      >
        CHARELI
      </div>

    {/* right side */}
      <div className='flex gap-4 items-center'>
        <div className="font-extrabold text-[#D946EF] dark:text-[#E879F9] flex items-center gap-4">
            <IoIosSearch className='w-6 h-6 cursor-pointer' />
            <IoMdSettings className='w-6 h-6 cursor-pointer' />
        </div>
        <div className="space-x-4 flex items-center">
          <img
            onClick={toggleDarkMode}
            src={isDarkMode ? moon : sun}
            alt={isDarkMode ? 'light mode' : 'dark mode'}
            className="w-6 h-6 cursor-pointer"
          />
          <Button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="bg-transparent flex items-center gap-2 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <IoExitOutline className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
