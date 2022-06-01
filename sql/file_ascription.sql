-- 檔案歸屬表

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `fileshare`
--

-- --------------------------------------------------------

--
-- 資料表結構 `file_ascription`
--

CREATE TABLE `file_ascription` (
  `user_hash` varchar(64) DEFAULT NULL COMMENT '用户哈希',
  `file_hash` varchar(64) DEFAULT NULL COMMENT '文件哈希值',
  `folder_path` varchar(1024) NOT NULL DEFAULT './' COMMENT '模拟文件夹路径'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文件归属表';

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `file_ascription`
--
ALTER TABLE `file_ascription`
  ADD UNIQUE KEY `f_uhash_fhash` (`user_hash`,`file_hash`) INVISIBLE,
  ADD KEY `f_fhash_idx` (`file_hash`) INVISIBLE;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `file_ascription`
--
ALTER TABLE `file_ascription`
  ADD CONSTRAINT `f_a_fhash` FOREIGN KEY (`file_hash`) REFERENCES `file_files` (`hash`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `f_a_uhash` FOREIGN KEY (`user_hash`) REFERENCES `account_user` (`hash`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
