-- 檔案列表

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
-- 資料表結構 `file_files`
--

CREATE TABLE `file_files` (
  `hash` varchar(64) NOT NULL COMMENT '文件哈希',
  `name` varchar(255) NOT NULL COMMENT '文件名',
  `describe` varchar(1024) DEFAULT NULL COMMENT '描述',
  `locale_code` varchar(45) NOT NULL DEFAULT 'zh-cn' COMMENT '语言代码',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否可用',
  `exist` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否存在',
  `creation_date` int NOT NULL COMMENT '创建日期',
  `modification_date` int NOT NULL COMMENT '修改日期',
  `path` varchar(512) NOT NULL COMMENT '文件地址',
  `size` bigint DEFAULT '-1' COMMENT '文件尺寸'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='文件列表';

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `file_files`
--
ALTER TABLE `file_files`
  ADD PRIMARY KEY (`hash`),
  ADD KEY `f_file_locale_code_idx` (`locale_code`);

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `file_files`
--
ALTER TABLE `file_files`
  ADD CONSTRAINT `f_file_locale_code` FOREIGN KEY (`locale_code`) REFERENCES `account_locale` (`code`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
