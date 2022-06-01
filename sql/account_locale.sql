-- 語言表

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
-- 資料表結構 `account_locale`
--

CREATE TABLE `account_locale` (
  `id` int NOT NULL COMMENT '编号',
  `code` varchar(45) NOT NULL COMMENT '代码',
  `name` varchar(255) NOT NULL COMMENT '语言名称'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='语言表';

--
-- 傾印資料表的資料 `account_locale`
--

INSERT INTO `account_locale` (`id`, `code`, `name`) VALUES
(1, 'en', 'English'),
(2, 'zh-cn', '中文'),
(3, 'zh-hk', '繁体中文');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `account_locale`
--
ALTER TABLE `account_locale`
  ADD PRIMARY KEY (`code`),
  ADD UNIQUE KEY `code_UNIQUE` (`code`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
