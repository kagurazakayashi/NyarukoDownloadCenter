-- 許可權表

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
-- 資料表結構 `account_permissions`
--

CREATE TABLE `account_permissions` (
  `id` bigint NOT NULL COMMENT 'ID',
  `name` varchar(255) NOT NULL COMMENT '名称',
  `describe` text NOT NULL COMMENT '描述',
  `ascription` tinyint(1) NOT NULL DEFAULT '0' COMMENT '归属(0:用户 1:文件)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='权限表';

--
-- 傾印資料表的資料 `account_permissions`
--

INSERT INTO `account_permissions` (`id`, `name`, `describe`, `ascription`) VALUES
(1, 'SuperAdmin', '管理员', 0),
(3, 'user', '用户', 0);

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `account_permissions`
--
ALTER TABLE `account_permissions`
  ADD PRIMARY KEY (`id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `account_permissions`
--
ALTER TABLE `account_permissions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
