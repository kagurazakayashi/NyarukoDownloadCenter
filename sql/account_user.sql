-- 使用者表

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
-- 資料表結構 `account_user`
--

CREATE TABLE `account_user` (
  `hash` varchar(64) NOT NULL COMMENT 'ID',
  `group_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户组代码',
  `permissions_id` bigint DEFAULT NULL COMMENT '权限ID',
  `username` varchar(255) NOT NULL COMMENT '用户名',
  `password` varchar(512) NOT NULL COMMENT '密码',
  `nickname` varchar(255) DEFAULT NULL COMMENT '昵称',
  `creation_date` int NOT NULL COMMENT '创建日期',
  `modification_date` int NOT NULL COMMENT '修改日期',
  `locale_code` varchar(45) NOT NULL COMMENT '语言代码',
  `enable` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `disable_startdate` int DEFAULT NULL COMMENT '封禁开始时间',
  `disable_enddate` int DEFAULT NULL COMMENT '封禁结束时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';

--
-- 傾印資料表的資料 `account_user`
--

INSERT INTO `account_user` (`hash`, `group_code`, `permissions_id`, `username`, `password`, `nickname`, `creation_date`, `modification_date`, `locale_code`, `enable`, `disable_startdate`, `disable_enddate`) VALUES
('7a06bad6901c9f4dfe901ad475a702949ad894f06cb1234a2dd78e36f8178a52', 'admin', 3, 'admin', 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec', 'admin', 1654141292, 1654141292, 'en', 1, NULL, NULL);

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `account_user`
--
ALTER TABLE `account_user`
  ADD PRIMARY KEY (`hash`),
  ADD UNIQUE KEY `username_UNIQUE` (`username`),
  ADD KEY `a_user_groupcode_idx` (`group_code`),
  ADD KEY `a_user_permissions_id_idx` (`permissions_id`),
  ADD KEY `a_user_locale_code_idx` (`locale_code`);

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `account_user`
--
ALTER TABLE `account_user`
  ADD CONSTRAINT `a_user_group_code` FOREIGN KEY (`group_code`) REFERENCES `account_group` (`code`),
  ADD CONSTRAINT `a_user_locale_code` FOREIGN KEY (`locale_code`) REFERENCES `account_locale` (`code`),
  ADD CONSTRAINT `a_user_permissions_id` FOREIGN KEY (`permissions_id`) REFERENCES `account_permissions` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
