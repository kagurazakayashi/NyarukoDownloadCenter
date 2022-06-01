-- 使用者組表

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
-- 資料表結構 `account_group`
--

CREATE TABLE `account_group` (
  `code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '代码',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '名称',
  `permissions_id` bigint DEFAULT NULL COMMENT '权限ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户组表';

--
-- 傾印資料表的資料 `account_group`
--

INSERT INTO `account_group` (`code`, `name`, `permissions_id`) VALUES
('admin', '文件管理员', 1),
('users', '文件接收用户', 3);

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `account_group`
--
ALTER TABLE `account_group`
  ADD PRIMARY KEY (`code`),
  ADD UNIQUE KEY `code_UNIQUE` (`code`),
  ADD KEY `a_group_permissions_id_idx` (`permissions_id`);

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `account_group`
--
ALTER TABLE `account_group`
  ADD CONSTRAINT `a_group_permissions_id` FOREIGN KEY (`permissions_id`) REFERENCES `account_permissions` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
