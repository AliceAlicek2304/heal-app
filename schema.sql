USE [master]
GO
/****** Object:  Database [HealApp]    Script Date: 6/21/2025 6:29:09 AM ******/
CREATE DATABASE [HealApp]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'HealApp', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.ALICESQL\MSSQL\DATA\HealApp.mdf' , SIZE = 73728KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'HealApp_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.ALICESQL\MSSQL\DATA\HealApp_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [HealApp] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [HealApp].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [HealApp] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [HealApp] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [HealApp] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [HealApp] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [HealApp] SET ARITHABORT OFF 
GO
ALTER DATABASE [HealApp] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [HealApp] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [HealApp] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [HealApp] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [HealApp] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [HealApp] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [HealApp] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [HealApp] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [HealApp] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [HealApp] SET  DISABLE_BROKER 
GO
ALTER DATABASE [HealApp] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [HealApp] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [HealApp] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [HealApp] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [HealApp] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [HealApp] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [HealApp] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [HealApp] SET RECOVERY FULL 
GO
ALTER DATABASE [HealApp] SET  MULTI_USER 
GO
ALTER DATABASE [HealApp] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [HealApp] SET DB_CHAINING OFF 
GO
ALTER DATABASE [HealApp] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [HealApp] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [HealApp] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [HealApp] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'HealApp', N'ON'
GO
ALTER DATABASE [HealApp] SET QUERY_STORE = ON
GO
ALTER DATABASE [HealApp] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [HealApp]
GO
/****** Object:  Table [dbo].[app_config]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[app_config](
	[config_key] [varchar](100) NOT NULL,
	[config_value] [nvarchar](max) NULL,
	[created_at] [datetime2](6) NOT NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NOT NULL,
	[updated_at] [datetime2](6) NULL,
	[updated_by] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[config_key] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[blog_posts]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[blog_posts](
	[post_id] [bigint] IDENTITY(1,1) NOT NULL,
	[content] [nvarchar](max) NULL,
	[created_at] [datetime2](6) NOT NULL,
	[rejection_reason] [nvarchar](max) NULL,
	[reviewed_at] [datetime2](6) NULL,
	[status] [varchar](255) NOT NULL,
	[thumbnail_image] [varchar](255) NULL,
	[title] [nvarchar](255) NOT NULL,
	[updated_at] [datetime2](6) NULL,
	[author_id] [bigint] NOT NULL,
	[category_id] [bigint] NOT NULL,
	[reviewer_id] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[post_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[blog_sections]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[blog_sections](
	[section_id] [bigint] IDENTITY(1,1) NOT NULL,
	[display_order] [int] NOT NULL,
	[section_content] [nvarchar](max) NULL,
	[section_image] [varchar](255) NULL,
	[section_title] [nvarchar](max) NULL,
	[post_id] [bigint] NOT NULL,
 CONSTRAINT [PK__blog_sec__F842676A700A151A] PRIMARY KEY CLUSTERED 
(
	[section_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[categories]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[categories](
	[category_id] [bigint] IDENTITY(1,1) NOT NULL,
	[description] [nvarchar](255) NULL,
	[name] [nvarchar](255) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[category_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[category_questions]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[category_questions](
	[category_question_id] [bigint] IDENTITY(1,1) NOT NULL,
	[description] [nvarchar](255) NULL,
	[name] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[category_question_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[consultant_profiles]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[consultant_profiles](
	[profile_id] [bigint] IDENTITY(1,1) NOT NULL,
	[bio] [nvarchar](2000) NULL,
	[created_at] [datetime2](6) NOT NULL,
	[experience] [nvarchar](1000) NULL,
	[qualifications] [nvarchar](1000) NULL,
	[updated_at] [datetime2](6) NULL,
	[user_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[profile_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[consultations]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[consultations](
	[consultation_id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[end_time] [datetime2](6) NOT NULL,
	[meet_url] [varchar](255) NULL,
	[start_time] [datetime2](6) NOT NULL,
	[status] [varchar](255) NOT NULL,
	[updated_at] [datetime2](6) NULL,
	[consultant_id] [bigint] NOT NULL,
	[customer_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[consultation_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[menstrual_cycle]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[menstrual_cycle](
	[cycle_id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[cycle_length] [bigint] NOT NULL,
	[number_of_days] [bigint] NOT NULL,
	[ovulation_date] [date] NOT NULL,
	[reminder_enabled] [bit] NOT NULL,
	[start_date] [date] NOT NULL,
	[user_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[cycle_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[package_services]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[package_services](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[package_id] [bigint] NOT NULL,
	[service_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payments]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payments](
	[payment_id] [bigint] IDENTITY(1,1) NOT NULL,
	[amount] [numeric](10, 2) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[currency] [varchar](3) NOT NULL,
	[description] [varchar](500) NULL,
	[expires_at] [datetime2](6) NULL,
	[notes] [nvarchar](max) NULL,
	[paid_at] [datetime2](6) NULL,
	[payment_method] [varchar](20) NOT NULL,
	[payment_status] [varchar](20) NOT NULL,
	[qr_code_url] [varchar](500) NULL,
	[qr_payment_reference] [varchar](50) NULL,
	[refund_amount] [numeric](10, 2) NULL,
	[refund_id] [varchar](100) NULL,
	[refunded_at] [datetime2](6) NULL,
	[service_id] [bigint] NOT NULL,
	[service_type] [varchar](20) NOT NULL,
	[stripe_payment_intent_id] [varchar](100) NULL,
	[transaction_id] [varchar](100) NULL,
	[updated_at] [datetime2](6) NOT NULL,
	[user_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[payment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pregnancy_prob_log]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pregnancy_prob_log](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[date] [date] NOT NULL,
	[probability] [float] NOT NULL,
	[menstrual_cycle_id] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[questions]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[questions](
	[question_id] [bigint] IDENTITY(1,1) NOT NULL,
	[answer] [nvarchar](max) NULL,
	[content] [nvarchar](max) NULL,
	[created_at] [datetime2](6) NOT NULL,
	[rejection_reason] [nvarchar](max) NULL,
	[status] [varchar](255) NULL,
	[updated_at] [datetime2](6) NULL,
	[category_question_id] [bigint] NOT NULL,
	[customer_id] [bigint] NOT NULL,
	[replier_id] [bigint] NULL,
	[updater_id] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[question_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[rating_summary]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[rating_summary](
	[summary_id] [bigint] IDENTITY(1,1) NOT NULL,
	[average_rating] [numeric](2, 1) NOT NULL,
	[five_star_count] [int] NOT NULL,
	[four_star_count] [int] NOT NULL,
	[last_updated] [datetime2](6) NOT NULL,
	[one_star_count] [int] NOT NULL,
	[target_id] [bigint] NOT NULL,
	[target_type] [varchar](20) NOT NULL,
	[three_star_count] [int] NOT NULL,
	[total_ratings] [int] NOT NULL,
	[two_star_count] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[summary_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ratings]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ratings](
	[rating_id] [bigint] IDENTITY(1,1) NOT NULL,
	[comment] [nvarchar](500) NULL,
	[consultation_id] [bigint] NULL,
	[created_at] [datetime2](6) NOT NULL,
	[is_active] [bit] NOT NULL,
	[rating] [int] NOT NULL,
	[replied_at] [datetime2](6) NULL,
	[staff_reply] [nvarchar](500) NULL,
	[sti_test_id] [bigint] NULL,
	[target_id] [bigint] NOT NULL,
	[target_type] [varchar](20) NOT NULL,
	[updated_at] [datetime2](6) NOT NULL,
	[replied_by] [bigint] NULL,
	[user_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[rating_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[roles]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[roles](
	[role_id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[description] [varchar](255) NULL,
	[role_name] [varchar](50) NOT NULL,
	[updated_at] [datetime2](6) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[role_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[service_test_components]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[service_test_components](
	[component_id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[reference_range] [varchar](100) NULL,
	[test_name] [varchar](100) NOT NULL,
	[updated_at] [datetime2](6) NOT NULL,
	[service_id] [bigint] NOT NULL,
	[status] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[component_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sti_packages]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sti_packages](
	[package_id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NOT NULL,
	[package_name] [varchar](200) NOT NULL,
	[package_price] [numeric](10, 2) NOT NULL,
	[updated_at] [datetime2](6) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[package_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sti_services]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sti_services](
	[service_id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[description] [nvarchar](max) NULL,
	[is_active] [bit] NOT NULL,
	[name] [nvarchar](max) NULL,
	[price] [float] NOT NULL,
	[updated_at] [datetime2](6) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[service_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sti_tests]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sti_tests](
	[test_id] [bigint] IDENTITY(1,1) NOT NULL,
	[appointment_date] [datetime2](6) NULL,
	[consultant_notes] [nvarchar](max) NULL,
	[created_at] [datetime2](6) NOT NULL,
	[customer_notes] [nvarchar](max) NULL,
	[result_date] [datetime2](6) NULL,
	[status] [varchar](20) NOT NULL,
	[total_price] [numeric](10, 2) NOT NULL,
	[updated_at] [datetime2](6) NOT NULL,
	[consultant_id] [bigint] NULL,
	[customer_id] [bigint] NOT NULL,
	[staff_id] [bigint] NULL,
	[service_id] [bigint] NULL,
	[package_id] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[test_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[test_results]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[test_results](
	[result_id] [bigint] IDENTITY(1,1) NOT NULL,
	[created_at] [datetime2](6) NOT NULL,
	[normal_range] [varchar](100) NULL,
	[result_value] [varchar](100) NULL,
	[reviewed_at] [datetime2](6) NULL,
	[reviewed_by] [bigint] NULL,
	[unit] [varchar](20) NULL,
	[updated_at] [datetime2](6) NOT NULL,
	[test_id] [bigint] NOT NULL,
	[component_id] [bigint] NOT NULL,
	[source_service_id] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[result_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user]    Script Date: 6/21/2025 6:29:09 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[avatar] [nvarchar](max) NULL,
	[birth_day] [date] NULL,
	[created_date] [datetime2](6) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[full_name] [nvarchar](255) NOT NULL,
	[gender] [varchar](10) NULL,
	[is_active] [bit] NOT NULL,
	[password] [varchar](255) NOT NULL,
	[phone] [varchar](15) NULL,
	[username] [varchar](255) NOT NULL,
	[role_id] [bigint] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[blog_posts] ON 

INSERT [dbo].[blog_posts] ([post_id], [content], [created_at], [rejection_reason], [reviewed_at], [status], [thumbnail_image], [title], [updated_at], [author_id], [category_id], [reviewer_id]) VALUES (1, N'Trong bài viết này, Lucia sẽ nói rõ về cách build Skirk và phân tích chi tiết bộ kỹ năng của cô nàng để giúp bạn đọc hiểu rõ về sức mạnh của nhân vật mới nhất trong Genshin Impact 5.7.

Với Skirk, game thủ sẽ có được một DPS cực kỳ gò bó về đội hình, nhưng cũng cực kỳ mạnh mẽ. Làm thế nào để phát huy được sức mạnh này, cách bộ kỹ năng của cô nàng hoạt động ra sao, và đâu là những bộ thánh di vật, vũ khí bạn có thể sử dụng? Đáp án sẽ được Lucia chia sẻ ngay sau đây.', CAST(N'2025-06-19T18:35:43.4971920' AS DateTime2), NULL, CAST(N'2025-06-19T18:36:22.8111860' AS DateTime2), N'CANCELED', N'/img/blog/thumb_3d70841d_20250619_183543.png', N'Genshin Impact: Hướng dẫn build Skirk hoàn chỉnh, giúp bạn "phá vỡ hư không"', CAST(N'2025-06-19T19:40:56.6353880' AS DateTime2), 1, 1, 3)
INSERT [dbo].[blog_posts] ([post_id], [content], [created_at], [rejection_reason], [reviewed_at], [status], [thumbnail_image], [title], [updated_at], [author_id], [category_id], [reviewer_id]) VALUES (2, N'Trong bài viết này, Lucia sẽ nói rõ về cách build Skirk và phân tích chi tiết bộ kỹ năng của cô nàng để giúp bạn đọc hiểu rõ về sức mạnh của nhân vật mới nhất trong Genshin Impact 5.7.

Với Skirk, game thủ sẽ có được một DPS cực kỳ gò bó về đội hình, nhưng cũng cực kỳ mạnh mẽ. Làm thế nào để phát huy được sức mạnh này, cách bộ kỹ năng của cô nàng hoạt động ra sao, và đâu là những bộ thánh di vật, vũ khí bạn có thể sử dụng? Đáp án sẽ được Lucia chia sẻ ngay sau đây.', CAST(N'2025-06-19T19:42:53.8547240' AS DateTime2), NULL, CAST(N'2025-06-19T19:47:14.4764950' AS DateTime2), N'CANCELED', NULL, N'Genshin Impact: Hướng dẫn build Skirk hoàn chỉnh, giúp bạn "phá vỡ hư không"', CAST(N'2025-06-19T19:47:40.3068320' AS DateTime2), 1, 1, 3)
INSERT [dbo].[blog_posts] ([post_id], [content], [created_at], [rejection_reason], [reviewed_at], [status], [thumbnail_image], [title], [updated_at], [author_id], [category_id], [reviewer_id]) VALUES (3, N'Trong bài viết này, Lucia sẽ nói rõ về cách build Skirk và phân tích chi tiết bộ kỹ năng của cô nàng để giúp bạn đọc hiểu rõ về sức mạnh của nhân vật mới nhất trong Genshin Impact 5.7.

Với Skirk, game thủ sẽ có được một DPS cực kỳ gò bó về đội hình, nhưng cũng cực kỳ mạnh mẽ. Làm thế nào để phát huy được sức mạnh này, cách bộ kỹ năng của cô nàng hoạt động ra sao, và đâu là những bộ thánh di vật, vũ khí bạn có thể sử dụng? Đáp án sẽ được Lucia chia sẻ ngay sau đây.', CAST(N'2025-06-19T19:50:22.3090660' AS DateTime2), NULL, CAST(N'2025-06-19T19:50:51.4876830' AS DateTime2), N'CONFIRMED', N'/img/blog/thumb_e7091615_20250619_195022.png', N'Genshin Impact: Hướng dẫn build Skirk hoàn chỉnh, giúp bạn "phá vỡ hư không"', CAST(N'2025-06-19T19:50:51.4876830' AS DateTime2), 1, 1, 3)
SET IDENTITY_INSERT [dbo].[blog_posts] OFF
GO
SET IDENTITY_INSERT [dbo].[blog_sections] ON 

INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (1, 1, N'Skirk là DPS thứ 2 trong Genshin Impact không sử dụng năng lượng (sau Mavuika) và có cách chơi phụ thuộc vào 2 loại "tài nguyên" đặc biệt khác nhau là Rắn Xảo Quyệt và Vết Nứt Hư Không. Chúng ta sẽ tìm hiểu ngay về chúng để có được nền tảng về cách chơi của nhân vật này.

Hai loại tài nguyên của Skirk:
Rắn Xảo Quyệt chính là thứ mà cô nàng cần để dùng chiêu nộ, và Skirk có thể giữ tối đa 100 điểm. Cách để nhận Rắn Xảo Quyệt rất đơn giản: Mỗi khi nhấn hoặc giữ kỹ năng nguyên tố, Skirk sẽ nhận 45 điểm Rắn Xảo Quyệt. Khi có từ 50 điểm trở lên, Skirk sẽ có thể sử dụng tuyệt kỹ của mình và gây lượng sát thương Băng AOE khổng lồ lên tất cả kẻ địch trong khu vực. Ngoài ra, sau khi kích hoạt hiệu quả hấp thụ Vết Nứt Hư Không của thiên phú cố định Lý Luận Vượt Nguyên Lý thì cô nàng cũng nhận thêm 8 điểm cho mỗi Vết Nứt.

Trong khi đó thì Vết Nứt Hư Không là một tài nguyên đặc biệt, và là một trong 2 cơ chế gắn liền với yêu cầu đội hình chỉ được dùng nhân vật Thủy và Băng của Skirk. Mỗi 2.5s, cô nàng có thể tạo ra 1 Vết Nứt Hư Không nằm trên chiến trường khi đồng đội kích hoạt phản ứng Đóng Băng, Siêu Dẫn, Khuếch Tán Băng hoặc Kết Tinh Băng lên kẻ địch. Sau đó, Skirk có thể hấp thụ chúng để nhận các buff khác nhau bằng các phương thức sau:

 ◆ Dùng trọng kích đánh trúng địch trong chế độ Thất Tướng Nhất Thiểm.
 ◆ Dùng chiêu nộ đặc biệt Cực Ác Kỹ - Tận trong chế độ Thất Tướng Nhất Thiểm.
 ◆ Nhấn giữ kỹ năng nguyên tố Cực Ác Kỹ - Tránh.

Bạn cần chú ý rằng dù Skirk không dùng năng lượng nguyên tố, chiêu E của cô nàng vẫn tạo ra 4 hạt năng lượng, có khả năng sạc cho đồng đội như bình thường. Nếu giữ E, Skirk sẽ có thể lơ lửng trên không và di chuyển vượt địa hình một cách hiệu quả.', N'/img/blog/section1_04e29bff_20250619_183543.jpg', N'B? k? nang c?a Skirk v?n hành nhu th? nào?', 1)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (2, 2, N'Bây giờ, chúng ta sẽ nói về hai cách chơi khác nhau của Skirk: đứng sân để đánh thường gây sát thương lâu dài, và quickswap – xuất hiện để "nuke" kẻ địch rồi rời sân. Cách chơi quickswap đơn giản là cho Skirk vào trận để thi triển chiêu nộ Cực Ác Kỹ - Diệt, với tất cả các buff mà bạn có thể tích trữ cho cô nàng. Điều duy nhất bạn cần chú ý là Skirk sở hữu một hiệu ứng buff cho Diệt: Khi có trên 50 điểm Rắn Xảo Quyệt thì mỗi điểm sẽ tăng 34.78% tấn công (ở level 10) và tính tối đa 12 điểm (ở C0). Do đó, bạn sẽ gây sát thương tối đa khi có 62 điểm.

Để chơi theo cách hypercarry gây sát thương bằng các đòn đánh thường thì phức tạp hơn một chút, nhưng thật ra cũng rất dễ hiểu. Game thủ sẽ khởi đầu bằng cách nhấn E khiến Skirk vào chế độ cường hóa mang tên Thất Tướng Nhất Thiểm kéo dài 12.5s hoặc khi hết điểm Rắn Xảo Quyệt:

 ◆Đòn đánh thường được đính kèm Băng không thể bị thay thế
 ◆Liên tục tiêu hao 7 điểm Rắn Xảo Quyệt mỗi giây.
 ◆Chiêu nộ Cực Ác Kỹ - Diệt sẽ được thay bằng chiêu nộ Cực Ác Kỹ - Tận.

Trong chế độ này, chiêu nộ Cực Ác Kỹ - Tận không tiêu hao Rắn Xảo Quyệt, không gây sát thương, mà chỉ khiến cô nàng vào trạng thái Điêu Tàn và hấp thụ tất cả Vết Nứt Hư Không gần đó. Điêu Tàn tăng 8% sát thương cho các đòn đánh thường và nếu hấp thụ được 1/2/3 Vết Nứt Hư Không, con số này sẽ tăng lên 12/16/20%. Sau 10 lần kích hoạt hoặc khi Thất Tướng Nhất Thiểm kết thúc thì Điêu Tàn cũng biến mất.

Thật ra thì trên lý thuyết, game thủ còn có thể chọn cách chơi thứ ba là "mix" các đòn đánh thường và tuyệt kỹ, nhưng điều này đòi hỏi rotation phức tạp để tích điểm Rắn Xảo Quyệt cho cả hai.', N'/img/blog/section2_a33593b4_20250619_183543.jpg', N'Hai cách choi Skirk', 1)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (3, 3, N'Bản thân Skirk sở hữu 2 buff cực kỳ quan trọng giúp tăng sát thương cho cả hai cách chơi của mình, và là lý do thứ 2 khiến game thủ buộc phải dùng nhân vật Thủy hoặc Băng trong đội hình. Thứ nhất là thiên phú thám hiểm cực mạnh: khi team chỉ toàn Thủy / Băng và có ít nhất một nhân vật Thủy + một nhân vật Băng, cấp chiêu E của cả đội sẽ được +1. Điều này khiến cho chiêu E của Skirk tăng lên level 11 ngay ở C0, tăng mạnh sát thương của cô nàng.

Buff thứ hai nằm ở thiên phú chiến đấu Về Với Quên Lãng: Mỗi khi một đồng đội Thủy hoặc Băng (không tính Skirk) đánh trúng kẻ địch, Skirk sẽ nhận 1 tầng Vượt Qua Chết Chóc. Mỗi nhân vật chỉ có thể cung cấp 1 tầng buff, tích tối đa 3 tầng, kéo dài 20s và mỗi tầng được tính giờ riêng. Dù có cách kích hoạt cực đơn giản, buff này lại vô cùng bá đạo: Khi có 1/2/3 tầng, đòn đánh thường của Skirk trong chế độ Thất Tướng Nhất Thiểm sẽ gây lượng sát thương bằng 110%/120%/170% sát thương gốc, chiêu nộ Cực Ác Kỹ - Diệt sẽ gây lượng sát thương bằng 105%/115%/160% sát thương gốc.

Như bạn có thể thấy, sự chênh lệch giữa một team 4 nhân vật Thủy / Băng với một team có sự tồn tại của các nhân vật thuộc bất kỳ nguyên tố nào khác là cực lớn. Vậy nên dù Skirk có thể tạo ra Vết Nứt Hư Không bằng cả các phản ứng giữa Băng với Nham và Phong, game thủ vẫn được khuyến khích dùng team full Thủy / Băng để tận dụng tối đa 2 thiên phú này.', N'/img/blog/section3_db0caca2_20250619_183543.jpg', N'T?i sao Skirk bu?c ph?i di team Th?y + Bang?', 1)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (4, 4, N'Một điều quan trọng mà game thủ cần chú ý là các đòn đánh của Skirk trong chế độ Thất Tướng Nhất Thiểm được tính sát thương theo cấp của chiêu E, nên bạn không cần phải nâng cấp Cực Ác Kỹ - Đoạn. Hãy ưu tiên nâng max chiêu E (nếu chơi hypercarry) hoặc chiêu Q (nếu chơi quickswap), còn kỹ năng đánh thường có thể được bỏ qua.

Khi phải lựa chọn giữa C1 và R1 cho Skirk, lời khuyên của Sforum là chọn R1 dù tạm thời chỉ mỗi cô nàng dùng tốt thanh kiếm này. Trấn Thương Diệu của Skirk vượt trội hoàn toàn so với tất cả các vũ khí 5 sao khác trong game. Trong khi đó thì C1 giúp Skirk gây ra thêm 500% sát thương Băng mỗi khi hấp thụ 1 Vết Nứt Hư Không, mạnh mẽ nhưng không thực sự cần thiết.', N'/img/blog/section4_55d0c16c_20250619_183543.jpg', N'Build Skirk nhu th? nào trong Genshin Impact?', 1)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (5, 5, N'Khi chọn thánh di vật cho Skirk, hãy dùng đồng hồ tấn công, ly Băng hoặc tấn công, nón bạo kích. Các chỉ số phụ cần được ưu tiên là bạo kích và tấn công. Skirk không cần đến nạp và tinh thông nguyên tố nếu bạn chơi theo đúng thiết kế của HoYoverse.

Các bộ thánh di vật mà bạn có thể dùng cho Skirk như sau:

 ◆ 4x Thợ Săn Marechaussee: Mang lại sát thương cao nhất cho Skirk, nhưng buộc game thủ phải dùng Skirk trong team của Furina, và lãng phí hiệu ứng bộ 2 món nếu bạn chơi quickswap. Đây có thể không phải là vấn đề trong phần lớn thời gian, nhưng đôi khi bạn sẽ không có Furina (ví dụ Nhà Hát Giả Tưởng) và khiến Skirk không tận dụng được bộ này. Nếu có C1, đây là lựa chọn tốt nhất cho Skirk.

 ◆ 4x Đoạn Kết Hành Lang Sâu: Yếu hơn một chút xíu so với 4x Thợ Săn, tuy nhiên lợi ích ở đây là bạn không cần phụ thuộc vào Furina. Nó cũng cho phép Skirk chơi theo 2 cách là quickswap và đứng sân đánh thường. Tuy nhiên nếu bạn sở hữu trấn, đây là lựa chọn giúp bạn build nhân vật dễ hơn, không sợ dư tỉ lệ bạo kích.

Ngoài ra, bạn cũng có thể dùng tạm bộ Dũng Sĩ Trong Băng Giá, nhưng do HoYoverse không ngừng nerf ngầm phản ứng Đóng Băng, bạn sẽ không nhận được hiệu ứng tăng TLBK của nó trong các trận đánh boss.', N'/img/blog/section5_8523fb71_20250619_183543.jpg', N'Build thánh di v?t cho Skirk trong Genshin Impact 5.7', 1)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (6, 6, N'Không như thánh di vật, Skirk có rất nhiều lựa chọn vũ khí khác nhau mà game thủ có thể dùng. Sau đây là các phương án được sắp xếp từ mạnh đến yếu:

 ◆ Thương Diệu: Vũ khí 5 sao của Skirk đem lại các hiệu ứng tuyệt vời: 22.1% tỉ lệ bạo kích, 48% tấn công và 40% sát thương bạo kích. Chỉ Skirk mới có thể phát huy hết tác dụng của thanh kiếm này.
 ◆ Haran: Trấn của Ayato tiếp tục được trọng dụng trên một DPS mới sau Clorinde. Thanh kiếm này đem lại DPS cao thứ 2 trong game, dù thua khoảng gần 20% so với Thương Diệu.
 ◆ Ánh Sáng Đêm Sương Mù, Bàn Nham Kết Lục: Luôn là vũ khí tốt cho các nhân vật DPS dùng kiếm. Theo tính toán của các theorycrafter thì hai thanh kiếm này chỉ thua Haran chưa đến 1%.
 ◆ Nhạc Khúc Biển Sâu R5: Lựa chọn free to play tốt nhất cho Skirk trong hầu hết trường hợp. Nó đem lại rất nhiều tấn công, nhưng bạn cần một healer tốt để xóa Khế Ước Sinh Mệnh mà nó tạo ra và nhận đủ buff.
 ◆ Tai Họa Eshu R5: Một lựa chọn free to play khác cho Skirk, có thể đem lại sát thương cao hơn Nhạc Khúc Biển Sâu R5 khi chơi Skirk theo hướng đứng sân đánh thường. Nhưng game thủ sẽ cần một nhân vật tạo khiên tốt.
 ◆ Thần Kiếm Lê Minh R5: Không quá hữu dụng trên Skirk do 2 nguyên tố Thủy / Băng thiếu các nhân vật tạo khiên thực sự mạnh, và khiến bạn không thể dùng Furina. Chỉ là một giải pháp tạm thời khi bạn chưa chế tạo được Nhạc Khúc Biển Sâu.
Ngoài các phương án trên, game thủ cũng có thể dùng Ánh Lá Phán Quyết, Kiếm Chước Phong, Xá Tội, Uraku, nhưng những vũ khí này chỉ tương đương với Nhạc Khúc Biển Sâu R5.', N'/img/blog/section6_b92a48b2_20250619_183543.jpg', N'Build vu khí cho Skirk trong Genshin Impact 5.7', 1)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (7, 7, N'Như bạn đọc Sforum có thể thấy thì việc build Skirk không quá khó, bởi chúng ta có rất nhiều lựa chọn vũ khí và 2 cách trang bị thánh di vật cho cô nàng. Chỉ cần làm theo hướng dẫn này, bạn đọc Sforum sẽ sở hữu một DPS hệ Băng mới cực kỳ mạnh mẽ ngay cả ở C0, đem lại khả năng chinh phục những thử thách khó của trò chơi. Ngay cả khi bạn không có Escoffier để đi cùng Skirk thì cũng đừng lo, vì Sforum sẽ sớm chia sẻ với bạn danh sách đồng đội tốt của Skirk!', NULL, N'T?ng k?t cách build Skirk', 1)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (9, 0, N'Skirk là DPS thứ 2 trong Genshin Impact không sử dụng năng lượng (sau Mavuika) và có cách chơi phụ thuộc vào 2 loại "tài nguyên" đặc biệt khác nhau là Rắn Xảo Quyệt và Vết Nứt Hư Không. Chúng ta sẽ tìm hiểu ngay về chúng để có được nền tảng về cách chơi của nhân vật này.

Hai loại tài nguyên của Skirk:

Rắn Xảo Quyệt chính là thứ mà cô nàng cần để dùng chiêu nộ, và Skirk có thể giữ tối đa 100 điểm. Cách để nhận Rắn Xảo Quyệt rất đơn giản: Mỗi khi nhấn hoặc giữ kỹ năng nguyên tố, Skirk sẽ nhận 45 điểm Rắn Xảo Quyệt. Khi có từ 50 điểm trở lên, Skirk sẽ có thể sử dụng tuyệt kỹ của mình và gây lượng sát thương Băng AOE khổng lồ lên tất cả kẻ địch trong khu vực. Ngoài ra, sau khi kích hoạt hiệu quả hấp thụ Vết Nứt Hư Không của thiên phú cố định Lý Luận Vượt Nguyên Lý thì cô nàng cũng nhận thêm 8 điểm cho mỗi Vết Nứt.

Trong khi đó thì Vết Nứt Hư Không là một tài nguyên đặc biệt, và là một trong 2 cơ chế gắn liền với yêu cầu đội hình chỉ được dùng nhân vật Thủy và Băng của Skirk. Mỗi 2.5s, cô nàng có thể tạo ra 1 Vết Nứt Hư Không nằm trên chiến trường khi đồng đội kích hoạt phản ứng Đóng Băng, Siêu Dẫn, Khuếch Tán Băng hoặc Kết Tinh Băng lên kẻ địch. Sau đó, Skirk có thể hấp thụ chúng để nhận các buff khác nhau bằng các phương thức sau:

 ◆ Dùng trọng kích đánh trúng địch trong chế độ Thất Tướng Nhất Thiểm.
 ◆ Dùng chiêu nộ đặc biệt Cực Ác Kỹ - Tận trong chế độ Thất Tướng Nhất Thiểm.
 ◆ Nhấn giữ kỹ năng nguyên tố Cực Ác Kỹ - Tránh.

Bạn cần chú ý rằng dù Skirk không dùng năng lượng nguyên tố, chiêu E của cô nàng vẫn tạo ra 4 hạt năng lượng, có khả năng sạc cho đồng đội như bình thường. Nếu giữ E, Skirk sẽ có thể lơ lửng trên không và di chuyển vượt địa hình một cách hiệu quả.', N'/img/blog/section1_99308188_20250619_194651.jpg', N'Bộ kỹ năng của Skirk vận hành như thế nào?', 2)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (10, 1, N'Bây giờ, chúng ta sẽ nói về hai cách chơi khác nhau của Skirk: đứng sân để đánh thường gây sát thương lâu dài, và quickswap – xuất hiện để "nuke" kẻ địch rồi rời sân. Cách chơi quickswap đơn giản là cho Skirk vào trận để thi triển chiêu nộ Cực Ác Kỹ - Diệt, với tất cả các buff mà bạn có thể tích trữ cho cô nàng. Điều duy nhất bạn cần chú ý là Skirk sở hữu một hiệu ứng buff cho Diệt: Khi có trên 50 điểm Rắn Xảo Quyệt thì mỗi điểm sẽ tăng 34.78% tấn công (ở level 10) và tính tối đa 12 điểm (ở C0). Do đó, bạn sẽ gây sát thương tối đa khi có 62 điểm.

Để chơi theo cách hypercarry gây sát thương bằng các đòn đánh thường thì phức tạp hơn một chút, nhưng thật ra cũng rất dễ hiểu. Game thủ sẽ khởi đầu bằng cách nhấn E khiến Skirk vào chế độ cường hóa mang tên Thất Tướng Nhất Thiểm kéo dài 12.5s hoặc khi hết điểm Rắn Xảo Quyệt:

 ◆ Đòn đánh thường được đính kèm Băng không thể bị thay thế
 ◆ Liên tục tiêu hao 7 điểm Rắn Xảo Quyệt mỗi giây.
 ◆ Chiêu nộ Cực Ác Kỹ - Diệt sẽ được thay bằng chiêu nộ Cực Ác Kỹ - Tận.

Trong chế độ này, chiêu nộ Cực Ác Kỹ - Tận không tiêu hao Rắn Xảo Quyệt, không gây sát thương, mà chỉ khiến cô nàng vào trạng thái Điêu Tàn và hấp thụ tất cả Vết Nứt Hư Không gần đó. Điêu Tàn tăng 8% sát thương cho các đòn đánh thường và nếu hấp thụ được 1/2/3 Vết Nứt Hư Không, con số này sẽ tăng lên 12/16/20%. Sau 10 lần kích hoạt hoặc khi Thất Tướng Nhất Thiểm kết thúc thì Điêu Tàn cũng biến mất.

Thật ra thì trên lý thuyết, game thủ còn có thể chọn cách chơi thứ ba là "mix" các đòn đánh thường và tuyệt kỹ, nhưng điều này đòi hỏi rotation phức tạp để tích điểm Rắn Xảo Quyệt cho cả hai.', N'/img/blog/section2_61cb2c71_20250619_194651.jpg', N'Hai cách chơi Skirk', 2)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (11, 2, N'Bản thân Skirk sở hữu 2 buff cực kỳ quan trọng giúp tăng sát thương cho cả hai cách chơi của mình, và là lý do thứ 2 khiến game thủ buộc phải dùng nhân vật Thủy hoặc Băng trong đội hình. Thứ nhất là thiên phú thám hiểm cực mạnh: khi team chỉ toàn Thủy / Băng và có ít nhất một nhân vật Thủy + một nhân vật Băng, cấp chiêu E của cả đội sẽ được +1. Điều này khiến cho chiêu E của Skirk tăng lên level 11 ngay ở C0, tăng mạnh sát thương của cô nàng.

Buff thứ hai nằm ở thiên phú chiến đấu Về Với Quên Lãng: Mỗi khi một đồng đội Thủy hoặc Băng (không tính Skirk) đánh trúng kẻ địch, Skirk sẽ nhận 1 tầng Vượt Qua Chết Chóc. Mỗi nhân vật chỉ có thể cung cấp 1 tầng buff, tích tối đa 3 tầng, kéo dài 20s và mỗi tầng được tính giờ riêng. Dù có cách kích hoạt cực đơn giản, buff này lại vô cùng bá đạo: Khi có 1/2/3 tầng, đòn đánh thường của Skirk trong chế độ Thất Tướng Nhất Thiểm sẽ gây lượng sát thương bằng 110%/120%/170% sát thương gốc, chiêu nộ Cực Ác Kỹ - Diệt sẽ gây lượng sát thương bằng 105%/115%/160% sát thương gốc.

Như bạn có thể thấy, sự chênh lệch giữa một team 4 nhân vật Thủy / Băng với một team có sự tồn tại của các nhân vật thuộc bất kỳ nguyên tố nào khác là cực lớn. Vậy nên dù Skirk có thể tạo ra Vết Nứt Hư Không bằng cả các phản ứng giữa Băng với Nham và Phong, game thủ vẫn được khuyến khích dùng team full Thủy / Băng để tận dụng tối đa 2 thiên phú này.', N'/img/blog/section3_fbb86dc2_20250619_194651.jpg', N'Tại sao Skirk buộc phải đi team Thủy + Băng?', 2)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (12, 3, N'Một điều quan trọng mà game thủ cần chú ý là các đòn đánh của Skirk trong chế độ Thất Tướng Nhất Thiểm được tính sát thương theo cấp của chiêu E, nên bạn không cần phải nâng cấp Cực Ác Kỹ - Đoạn. Hãy ưu tiên nâng max chiêu E (nếu chơi hypercarry) hoặc chiêu Q (nếu chơi quickswap), còn kỹ năng đánh thường có thể được bỏ qua.

Khi phải lựa chọn giữa C1 và R1 cho Skirk, lời khuyên của Sforum là chọn R1 dù tạm thời chỉ mỗi cô nàng dùng tốt thanh kiếm này. Trấn Thương Diệu của Skirk vượt trội hoàn toàn so với tất cả các vũ khí 5 sao khác trong game. Trong khi đó thì C1 giúp Skirk gây ra thêm 500% sát thương Băng mỗi khi hấp thụ 1 Vết Nứt Hư Không, mạnh mẽ nhưng không thực sự cần thiết.', N'/img/blog/section4_92f4b86f_20250619_194651.jpg', N'Build Skirk như thế nào trong Genshin Impact?', 2)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (13, 4, N'Khi chọn thánh di vật cho Skirk, hãy dùng đồng hồ tấn công, ly Băng hoặc tấn công, nón bạo kích. Các chỉ số phụ cần được ưu tiên là bạo kích và tấn công. Skirk không cần đến nạp và tinh thông nguyên tố nếu bạn chơi theo đúng thiết kế của HoYoverse.

Các bộ thánh di vật mà bạn có thể dùng cho Skirk như sau:

 ◆ 4x Thợ Săn Marechaussee: Mang lại sát thương cao nhất cho Skirk, nhưng buộc game thủ phải dùng Skirk trong team của Furina, và lãng phí hiệu ứng bộ 2 món nếu bạn chơi quickswap. Đây có thể không phải là vấn đề trong phần lớn thời gian, nhưng đôi khi bạn sẽ không có Furina (ví dụ Nhà Hát Giả Tưởng) và khiến Skirk không tận dụng được bộ này. Nếu có C1, đây là lựa chọn tốt nhất cho Skirk.
 ◆ 4x Đoạn Kết Hành Lang Sâu: Yếu hơn một chút xíu so với 4x Thợ Săn, tuy nhiên lợi ích ở đây là bạn không cần phụ thuộc vào Furina. Nó cũng cho phép Skirk chơi theo 2 cách là quickswap và đứng sân đánh thường. Tuy nhiên nếu bạn sở hữu trấn, đây là lựa chọn giúp bạn build nhân vật dễ hơn, không sợ dư tỉ lệ bạo kích.
 ◆ Ngoài ra, bạn cũng có thể dùng tạm bộ Dũng Sĩ Trong Băng Giá, nhưng do HoYoverse không ngừng nerf ngầm phản ứng Đóng Băng, bạn sẽ không nhận được hiệu ứng tăng TLBK của nó trong các trận đánh boss.', N'/img/blog/section5_9ddbf139_20250619_194651.jpg', N'Build thánh di vật cho Skirk trong Genshin Impact 5.7', 2)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (14, 5, N'Không như thánh di vật, Skirk có rất nhiều lựa chọn vũ khí khác nhau mà game thủ có thể dùng. Sau đây là các phương án được sắp xếp từ mạnh đến yếu:

 ◆ Thương Diệu: Vũ khí 5 sao của Skirk đem lại các hiệu ứng tuyệt vời: 22.1% tỉ lệ bạo kích, 48% tấn công và 40% sát thương bạo kích. Chỉ Skirk mới có thể phát huy hết tác dụng của thanh kiếm này.
 ◆ Haran: Trấn của Ayato tiếp tục được trọng dụng trên một DPS mới sau Clorinde. Thanh kiếm này đem lại DPS cao thứ 2 trong game, dù thua khoảng gần 20% so với Thương Diệu.
 ◆ Ánh Sáng Đêm Sương Mù, Bàn Nham Kết Lục: Luôn là vũ khí tốt cho các nhân vật DPS dùng kiếm. Theo tính toán của các theorycrafter thì hai thanh kiếm này chỉ thua Haran chưa đến 1%.
 ◆ Nhạc Khúc Biển Sâu R5: Lựa chọn free to play tốt nhất cho Skirk trong hầu hết trường hợp. Nó đem lại rất nhiều tấn công, nhưng bạn cần một healer tốt để xóa Khế Ước Sinh Mệnh mà nó tạo ra và nhận đủ buff.
 ◆ Tai Họa Eshu R5: Một lựa chọn free to play khác cho Skirk, có thể đem lại sát thương cao hơn Nhạc Khúc Biển Sâu R5 khi chơi Skirk theo hướng đứng sân đánh thường. Nhưng game thủ sẽ cần một nhân vật tạo khiên tốt.
 ◆ Thần Kiếm Lê Minh R5: Không quá hữu dụng trên Skirk do 2 nguyên tố Thủy / Băng thiếu các nhân vật tạo khiên thực sự mạnh, và khiến bạn không thể dùng Furina. Chỉ là một giải pháp tạm thời khi bạn chưa chế tạo được Nhạc Khúc Biển Sâu.
 ◆ Ngoài các phương án trên, game thủ cũng có thể dùng Ánh Lá Phán Quyết, Kiếm Chước Phong, Xá Tội, Uraku, nhưng những vũ khí này chỉ tương đương với Nhạc Khúc Biển Sâu R5.', N'/img/blog/section6_a1ca3d38_20250619_194651.jpg', N'Build vũ khí cho Skirk trong Genshin Impact 5.7', 2)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (15, 6, N'Như bạn đọc Sforum có thể thấy thì việc build Skirk không quá khó, bởi chúng ta có rất nhiều lựa chọn vũ khí và 2 cách trang bị thánh di vật cho cô nàng. Chỉ cần làm theo hướng dẫn này, bạn đọc Sforum sẽ sở hữu một DPS hệ Băng mới cực kỳ mạnh mẽ ngay cả ở C0, đem lại khả năng chinh phục những thử thách khó của trò chơi. Ngay cả khi bạn không có Escoffier để đi cùng Skirk thì cũng đừng lo, vì Sforum sẽ sớm chia sẻ với bạn danh sách đồng đội tốt của Skirk!', NULL, N'Tổng kết cách build Skirk', 2)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (16, 1, N'Skirk là DPS thứ 2 trong Genshin Impact không sử dụng năng lượng (sau Mavuika) và có cách chơi phụ thuộc vào 2 loại "tài nguyên" đặc biệt khác nhau là Rắn Xảo Quyệt và Vết Nứt Hư Không. Chúng ta sẽ tìm hiểu ngay về chúng để có được nền tảng về cách chơi của nhân vật này.

Hai loại tài nguyên của Skirk:

Rắn Xảo Quyệt chính là thứ mà cô nàng cần để dùng chiêu nộ, và Skirk có thể giữ tối đa 100 điểm. Cách để nhận Rắn Xảo Quyệt rất đơn giản: Mỗi khi nhấn hoặc giữ kỹ năng nguyên tố, Skirk sẽ nhận 45 điểm Rắn Xảo Quyệt. Khi có từ 50 điểm trở lên, Skirk sẽ có thể sử dụng tuyệt kỹ của mình và gây lượng sát thương Băng AOE khổng lồ lên tất cả kẻ địch trong khu vực. Ngoài ra, sau khi kích hoạt hiệu quả hấp thụ Vết Nứt Hư Không của thiên phú cố định Lý Luận Vượt Nguyên Lý thì cô nàng cũng nhận thêm 8 điểm cho mỗi Vết Nứt.

Trong khi đó thì Vết Nứt Hư Không là một tài nguyên đặc biệt, và là một trong 2 cơ chế gắn liền với yêu cầu đội hình chỉ được dùng nhân vật Thủy và Băng của Skirk. Mỗi 2.5s, cô nàng có thể tạo ra 1 Vết Nứt Hư Không nằm trên chiến trường khi đồng đội kích hoạt phản ứng Đóng Băng, Siêu Dẫn, Khuếch Tán Băng hoặc Kết Tinh Băng lên kẻ địch. Sau đó, Skirk có thể hấp thụ chúng để nhận các buff khác nhau bằng các phương thức sau:

 ◆ Dùng trọng kích đánh trúng địch trong chế độ Thất Tướng Nhất Thiểm.
 ◆ Dùng chiêu nộ đặc biệt Cực Ác Kỹ - Tận trong chế độ Thất Tướng Nhất Thiểm.
 ◆ Nhấn giữ kỹ năng nguyên tố Cực Ác Kỹ - Tránh.

Bạn cần chú ý rằng dù Skirk không dùng năng lượng nguyên tố, chiêu E của cô nàng vẫn tạo ra 4 hạt năng lượng, có khả năng sạc cho đồng đội như bình thường. Nếu giữ E, Skirk sẽ có thể lơ lửng trên không và di chuyển vượt địa hình một cách hiệu quả.', N'/img/blog/section1_ae7146cd_20250619_195022.jpg', N'Bộ kỹ năng của Skirk vận hành như thế nào?', 3)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (17, 2, N'Bây giờ, chúng ta sẽ nói về hai cách chơi khác nhau của Skirk: đứng sân để đánh thường gây sát thương lâu dài, và quickswap – xuất hiện để "nuke" kẻ địch rồi rời sân. Cách chơi quickswap đơn giản là cho Skirk vào trận để thi triển chiêu nộ Cực Ác Kỹ - Diệt, với tất cả các buff mà bạn có thể tích trữ cho cô nàng. Điều duy nhất bạn cần chú ý là Skirk sở hữu một hiệu ứng buff cho Diệt: Khi có trên 50 điểm Rắn Xảo Quyệt thì mỗi điểm sẽ tăng 34.78% tấn công (ở level 10) và tính tối đa 12 điểm (ở C0). Do đó, bạn sẽ gây sát thương tối đa khi có 62 điểm.

Để chơi theo cách hypercarry gây sát thương bằng các đòn đánh thường thì phức tạp hơn một chút, nhưng thật ra cũng rất dễ hiểu. Game thủ sẽ khởi đầu bằng cách nhấn E khiến Skirk vào chế độ cường hóa mang tên Thất Tướng Nhất Thiểm kéo dài 12.5s hoặc khi hết điểm Rắn Xảo Quyệt:

 ◆ Đòn đánh thường được đính kèm Băng không thể bị thay thế
 ◆ Liên tục tiêu hao 7 điểm Rắn Xảo Quyệt mỗi giây.
 ◆ Chiêu nộ Cực Ác Kỹ - Diệt sẽ được thay bằng chiêu nộ Cực Ác Kỹ - Tận.

Trong chế độ này, chiêu nộ Cực Ác Kỹ - Tận không tiêu hao Rắn Xảo Quyệt, không gây sát thương, mà chỉ khiến cô nàng vào trạng thái Điêu Tàn và hấp thụ tất cả Vết Nứt Hư Không gần đó. Điêu Tàn tăng 8% sát thương cho các đòn đánh thường và nếu hấp thụ được 1/2/3 Vết Nứt Hư Không, con số này sẽ tăng lên 12/16/20%. Sau 10 lần kích hoạt hoặc khi Thất Tướng Nhất Thiểm kết thúc thì Điêu Tàn cũng biến mất.

Thật ra thì trên lý thuyết, game thủ còn có thể chọn cách chơi thứ ba là "mix" các đòn đánh thường và tuyệt kỹ, nhưng điều này đòi hỏi rotation phức tạp để tích điểm Rắn Xảo Quyệt cho cả hai.', N'/img/blog/section2_c79cf1c6_20250619_195022.jpg', N'Hai cách chơi Skirk', 3)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (18, 3, N'Bản thân Skirk sở hữu 2 buff cực kỳ quan trọng giúp tăng sát thương cho cả hai cách chơi của mình, và là lý do thứ 2 khiến game thủ buộc phải dùng nhân vật Thủy hoặc Băng trong đội hình. Thứ nhất là thiên phú thám hiểm cực mạnh: khi team chỉ toàn Thủy / Băng và có ít nhất một nhân vật Thủy + một nhân vật Băng, cấp chiêu E của cả đội sẽ được +1. Điều này khiến cho chiêu E của Skirk tăng lên level 11 ngay ở C0, tăng mạnh sát thương của cô nàng.

Buff thứ hai nằm ở thiên phú chiến đấu Về Với Quên Lãng: Mỗi khi một đồng đội Thủy hoặc Băng (không tính Skirk) đánh trúng kẻ địch, Skirk sẽ nhận 1 tầng Vượt Qua Chết Chóc. Mỗi nhân vật chỉ có thể cung cấp 1 tầng buff, tích tối đa 3 tầng, kéo dài 20s và mỗi tầng được tính giờ riêng. Dù có cách kích hoạt cực đơn giản, buff này lại vô cùng bá đạo: Khi có 1/2/3 tầng, đòn đánh thường của Skirk trong chế độ Thất Tướng Nhất Thiểm sẽ gây lượng sát thương bằng 110%/120%/170% sát thương gốc, chiêu nộ Cực Ác Kỹ - Diệt sẽ gây lượng sát thương bằng 105%/115%/160% sát thương gốc.

Như bạn có thể thấy, sự chênh lệch giữa một team 4 nhân vật Thủy / Băng với một team có sự tồn tại của các nhân vật thuộc bất kỳ nguyên tố nào khác là cực lớn. Vậy nên dù Skirk có thể tạo ra Vết Nứt Hư Không bằng cả các phản ứng giữa Băng với Nham và Phong, game thủ vẫn được khuyến khích dùng team full Thủy / Băng để tận dụng tối đa 2 thiên phú này.', N'/img/blog/section3_6974ec50_20250619_195022.jpg', N'Tại sao Skirk buộc phải đi team Thủy + Băng?', 3)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (19, 4, N'Một điều quan trọng mà game thủ cần chú ý là các đòn đánh của Skirk trong chế độ Thất Tướng Nhất Thiểm được tính sát thương theo cấp của chiêu E, nên bạn không cần phải nâng cấp Cực Ác Kỹ - Đoạn. Hãy ưu tiên nâng max chiêu E (nếu chơi hypercarry) hoặc chiêu Q (nếu chơi quickswap), còn kỹ năng đánh thường có thể được bỏ qua.

Khi phải lựa chọn giữa C1 và R1 cho Skirk, lời khuyên của Sforum là chọn R1 dù tạm thời chỉ mỗi cô nàng dùng tốt thanh kiếm này. Trấn Thương Diệu của Skirk vượt trội hoàn toàn so với tất cả các vũ khí 5 sao khác trong game. Trong khi đó thì C1 giúp Skirk gây ra thêm 500% sát thương Băng mỗi khi hấp thụ 1 Vết Nứt Hư Không, mạnh mẽ nhưng không thực sự cần thiết.', N'/img/blog/section4_3ace0b5c_20250619_195022.jpg', N'Build Skirk như thế nào trong Genshin Impact?', 3)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (20, 5, N'Khi chọn thánh di vật cho Skirk, hãy dùng đồng hồ tấn công, ly Băng hoặc tấn công, nón bạo kích. Các chỉ số phụ cần được ưu tiên là bạo kích và tấn công. Skirk không cần đến nạp và tinh thông nguyên tố nếu bạn chơi theo đúng thiết kế của HoYoverse.

Các bộ thánh di vật mà bạn có thể dùng cho Skirk như sau:

 ◆ 4x Thợ Săn Marechaussee: Mang lại sát thương cao nhất cho Skirk, nhưng buộc game thủ phải dùng Skirk trong team của Furina, và lãng phí hiệu ứng bộ 2 món nếu bạn chơi quickswap. Đây có thể không phải là vấn đề trong phần lớn thời gian, nhưng đôi khi bạn sẽ không có Furina (ví dụ Nhà Hát Giả Tưởng) và khiến Skirk không tận dụng được bộ này. Nếu có C1, đây là lựa chọn tốt nhất cho Skirk.
 ◆ 4x Đoạn Kết Hành Lang Sâu: Yếu hơn một chút xíu so với 4x Thợ Săn, tuy nhiên lợi ích ở đây là bạn không cần phụ thuộc vào Furina. Nó cũng cho phép Skirk chơi theo 2 cách là quickswap và đứng sân đánh thường. Tuy nhiên nếu bạn sở hữu trấn, đây là lựa chọn giúp bạn build nhân vật dễ hơn, không sợ dư tỉ lệ bạo kích.
 ◆ Ngoài ra, bạn cũng có thể dùng tạm bộ Dũng Sĩ Trong Băng Giá, nhưng do HoYoverse không ngừng nerf ngầm phản ứng Đóng Băng, bạn sẽ không nhận được hiệu ứng tăng TLBK của nó trong các trận đánh boss.', N'/img/blog/section5_b96b4346_20250619_195022.jpg', N'Build thánh di vật cho Skirk trong Genshin Impact 5.7', 3)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (21, 6, N'Không như thánh di vật, Skirk có rất nhiều lựa chọn vũ khí khác nhau mà game thủ có thể dùng. Sau đây là các phương án được sắp xếp từ mạnh đến yếu:

 ◆ Thương Diệu: Vũ khí 5 sao của Skirk đem lại các hiệu ứng tuyệt vời: 22.1% tỉ lệ bạo kích, 48% tấn công và 40% sát thương bạo kích. Chỉ Skirk mới có thể phát huy hết tác dụng của thanh kiếm này.
 ◆ Haran: Trấn của Ayato tiếp tục được trọng dụng trên một DPS mới sau Clorinde. Thanh kiếm này đem lại DPS cao thứ 2 trong game, dù thua khoảng gần 20% so với Thương Diệu.
 ◆ Ánh Sáng Đêm Sương Mù, Bàn Nham Kết Lục: Luôn là vũ khí tốt cho các nhân vật DPS dùng kiếm. Theo tính toán của các theorycrafter thì hai thanh kiếm này chỉ thua Haran chưa đến 1%.
 ◆ Nhạc Khúc Biển Sâu R5: Lựa chọn free to play tốt nhất cho Skirk trong hầu hết trường hợp. Nó đem lại rất nhiều tấn công, nhưng bạn cần một healer tốt để xóa Khế Ước Sinh Mệnh mà nó tạo ra và nhận đủ buff.
 ◆ Tai Họa Eshu R5: Một lựa chọn free to play khác cho Skirk, có thể đem lại sát thương cao hơn Nhạc Khúc Biển Sâu R5 khi chơi Skirk theo hướng đứng sân đánh thường. Nhưng game thủ sẽ cần một nhân vật tạo khiên tốt.
 ◆ Thần Kiếm Lê Minh R5: Không quá hữu dụng trên Skirk do 2 nguyên tố Thủy / Băng thiếu các nhân vật tạo khiên thực sự mạnh, và khiến bạn không thể dùng Furina. Chỉ là một giải pháp tạm thời khi bạn chưa chế tạo được Nhạc Khúc Biển Sâu.
 ◆ Ngoài các phương án trên, game thủ cũng có thể dùng Ánh Lá Phán Quyết, Kiếm Chước Phong, Xá Tội, Uraku, nhưng những vũ khí này chỉ tương đương với Nhạc Khúc Biển Sâu R5.', N'/img/blog/section6_de518adf_20250619_195022.jpg', N'Build vũ khí cho Skirk trong Genshin Impact 5.7', 3)
INSERT [dbo].[blog_sections] ([section_id], [display_order], [section_content], [section_image], [section_title], [post_id]) VALUES (22, 7, N'Như bạn đọc Lucia có thể thấy thì việc build Skirk không quá khó, bởi chúng ta có rất nhiều lựa chọn vũ khí và 2 cách trang bị thánh di vật cho cô nàng. Chỉ cần làm theo hướng dẫn này, bạn đọc Lucia sẽ sở hữu một DPS hệ Băng mới cực kỳ mạnh mẽ ngay cả ở C0, đem lại khả năng chinh phục những thử thách khó của trò chơi. Ngay cả khi bạn không có Escoffier để đi cùng Skirk thì cũng đừng lo, vì Lucia sẽ sớm chia sẻ với bạn danh sách đồng đội tốt của Skirk!', NULL, N'Tổng kết cách build Skirk', 3)
SET IDENTITY_INSERT [dbo].[blog_sections] OFF
GO
SET IDENTITY_INSERT [dbo].[categories] ON 

INSERT [dbo].[categories] ([category_id], [description], [name]) VALUES (1, N'123', N'Danh mục 1')
SET IDENTITY_INSERT [dbo].[categories] OFF
GO
SET IDENTITY_INSERT [dbo].[category_questions] ON 

INSERT [dbo].[category_questions] ([category_question_id], [description], [name]) VALUES (1, N'321', N'Danh mục 1')
SET IDENTITY_INSERT [dbo].[category_questions] OFF
GO
SET IDENTITY_INSERT [dbo].[consultant_profiles] ON 

INSERT [dbo].[consultant_profiles] ([profile_id], [bio], [created_at], [experience], [qualifications], [updated_at], [user_id]) VALUES (1, N'Có kinh nghiệm sâu rộng trong tư vấn, chẩn đoán, và hỗ trợ bệnh nhân mắc các bệnh STI. Tận tâm trong việc cung cấp thông tin y khoa chính xác, dễ hiểu, và hỗ trợ khách hàng lựa chọn xét nghiệm phù hợp.', CAST(N'2025-06-15T00:27:32.4837290' AS DateTime2), N'5 năm kinh nghiệm làm việc tại Bệnh viện Nhiệt đới TP.HCM', N'Bác sĩ chuyên khoa Truyền nhiễm.', CAST(N'2025-06-18T04:29:55.4108070' AS DateTime2), 2)
INSERT [dbo].[consultant_profiles] ([profile_id], [bio], [created_at], [experience], [qualifications], [updated_at], [user_id]) VALUES (3, N'No details updated yet', CAST(N'2025-06-18T07:49:31.4689020' AS DateTime2), N'0 years experience', N'Not updated yet', NULL, 6)
SET IDENTITY_INSERT [dbo].[consultant_profiles] OFF
GO
SET IDENTITY_INSERT [dbo].[consultations] ON 

INSERT [dbo].[consultations] ([consultation_id], [created_at], [end_time], [meet_url], [start_time], [status], [updated_at], [consultant_id], [customer_id]) VALUES (1, CAST(N'2025-06-15T10:51:47.8992110' AS DateTime2), CAST(N'2025-06-16T10:00:00.0000000' AS DateTime2), N'https://meet.jit.si/Heal_Consultation_1_1044f602', CAST(N'2025-06-16T08:00:00.0000000' AS DateTime2), N'CONFIRMED', CAST(N'2025-06-15T10:52:02.6388290' AS DateTime2), 2, 1)
INSERT [dbo].[consultations] ([consultation_id], [created_at], [end_time], [meet_url], [start_time], [status], [updated_at], [consultant_id], [customer_id]) VALUES (2, CAST(N'2025-06-20T14:28:42.9030600' AS DateTime2), CAST(N'2025-06-24T12:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-24T10:00:00.0000000' AS DateTime2), N'PENDING', NULL, 2, 1)
SET IDENTITY_INSERT [dbo].[consultations] OFF
GO
SET IDENTITY_INSERT [dbo].[menstrual_cycle] ON 

INSERT [dbo].[menstrual_cycle] ([cycle_id], [created_at], [cycle_length], [number_of_days], [ovulation_date], [reminder_enabled], [start_date], [user_id]) VALUES (1, CAST(N'2025-06-15T04:23:14.3815310' AS DateTime2), 28, 5, CAST(N'2025-06-28' AS Date), 0, CAST(N'2025-06-14' AS Date), 1)
SET IDENTITY_INSERT [dbo].[menstrual_cycle] OFF
GO
SET IDENTITY_INSERT [dbo].[package_services] ON 

INSERT [dbo].[package_services] ([id], [created_at], [package_id], [service_id]) VALUES (6, CAST(N'2025-06-15T02:36:05.2168070' AS DateTime2), 3, 1)
INSERT [dbo].[package_services] ([id], [created_at], [package_id], [service_id]) VALUES (7, CAST(N'2025-06-15T02:36:05.2479480' AS DateTime2), 3, 2)
SET IDENTITY_INSERT [dbo].[package_services] OFF
GO
SET IDENTITY_INSERT [dbo].[payments] ON 

INSERT [dbo].[payments] ([payment_id], [amount], [created_at], [currency], [description], [expires_at], [notes], [paid_at], [payment_method], [payment_status], [qr_code_url], [qr_payment_reference], [refund_amount], [refund_id], [refunded_at], [service_id], [service_type], [stripe_payment_intent_id], [transaction_id], [updated_at], [user_id]) VALUES (1, CAST(500000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T00:34:11.2802150' AS DateTime2), N'VND', N'STI Test: HIV Ag/Ab Combo', NULL, NULL, CAST(N'2025-06-15T00:34:11.2962930' AS DateTime2), N'COD', N'COMPLETED', NULL, NULL, NULL, NULL, NULL, 1, N'STI', NULL, NULL, CAST(N'2025-06-15T00:34:11.3022740' AS DateTime2), 1)
INSERT [dbo].[payments] ([payment_id], [amount], [created_at], [currency], [description], [expires_at], [notes], [paid_at], [payment_method], [payment_status], [qr_code_url], [qr_payment_reference], [refund_amount], [refund_id], [refunded_at], [service_id], [service_type], [stripe_payment_intent_id], [transaction_id], [updated_at], [user_id]) VALUES (2, CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T03:31:03.5942900' AS DateTime2), N'VND', N'STI Package: COMBO HIV + GIang Mai', NULL, NULL, CAST(N'2025-06-15T03:31:06.7951380' AS DateTime2), N'VISA', N'COMPLETED', NULL, NULL, NULL, NULL, NULL, 5, N'STI', N'pi_3Ra0jF1JnNChU1O615JF9pAT', N'pi_3Ra0jF1JnNChU1O615JF9pAT', CAST(N'2025-06-15T03:31:06.8001670' AS DateTime2), 1)
INSERT [dbo].[payments] ([payment_id], [amount], [created_at], [currency], [description], [expires_at], [notes], [paid_at], [payment_method], [payment_status], [qr_code_url], [qr_payment_reference], [refund_amount], [refund_id], [refunded_at], [service_id], [service_type], [stripe_payment_intent_id], [transaction_id], [updated_at], [user_id]) VALUES (3, CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T03:32:14.5349040' AS DateTime2), N'VND', N'STI Package: COMBO HIV + GIang Mai', CAST(N'2025-06-16T03:32:14.5411680' AS DateTime2), NULL, NULL, N'QR_CODE', N'PENDING', N'https://img.vietqr.io/image/970422-0349079940-compact.png?amount=800000.00&addInfo=HEALSTI6134541288&accountName=NGUYEN+VAN+CUONG', N'HEALSTI6134541288', NULL, NULL, NULL, 6, N'STI', NULL, NULL, CAST(N'2025-06-15T03:32:14.5441800' AS DateTime2), 1)
INSERT [dbo].[payments] ([payment_id], [amount], [created_at], [currency], [description], [expires_at], [notes], [paid_at], [payment_method], [payment_status], [qr_code_url], [qr_payment_reference], [refund_amount], [refund_id], [refunded_at], [service_id], [service_type], [stripe_payment_intent_id], [transaction_id], [updated_at], [user_id]) VALUES (4, CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T10:18:06.2487550' AS DateTime2), N'VND', N'STI Package: COMBO HIV + GIang Mai', NULL, NULL, CAST(N'2025-06-15T10:18:06.2578520' AS DateTime2), N'COD', N'COMPLETED', NULL, NULL, NULL, NULL, NULL, 7, N'STI', NULL, NULL, CAST(N'2025-06-15T10:18:06.2618520' AS DateTime2), 1)
INSERT [dbo].[payments] ([payment_id], [amount], [created_at], [currency], [description], [expires_at], [notes], [paid_at], [payment_method], [payment_status], [qr_code_url], [qr_payment_reference], [refund_amount], [refund_id], [refunded_at], [service_id], [service_type], [stripe_payment_intent_id], [transaction_id], [updated_at], [user_id]) VALUES (5, CAST(500000.00 AS Numeric(10, 2)), CAST(N'2025-06-19T21:13:08.8538530' AS DateTime2), N'VND', N'STI Test: Syphilis Screening', NULL, NULL, CAST(N'2025-06-19T21:13:08.8653370' AS DateTime2), N'COD', N'COMPLETED', NULL, NULL, NULL, NULL, NULL, 8, N'STI', NULL, NULL, CAST(N'2025-06-19T21:13:08.8689590' AS DateTime2), 1)
INSERT [dbo].[payments] ([payment_id], [amount], [created_at], [currency], [description], [expires_at], [notes], [paid_at], [payment_method], [payment_status], [qr_code_url], [qr_payment_reference], [refund_amount], [refund_id], [refunded_at], [service_id], [service_type], [stripe_payment_intent_id], [transaction_id], [updated_at], [user_id]) VALUES (6, CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-20T14:18:04.1130650' AS DateTime2), N'VND', N'STI Package: COMBO HIV + GIang Mai', NULL, NULL, CAST(N'2025-06-20T14:18:05.9960450' AS DateTime2), N'VISA', N'COMPLETED', NULL, NULL, NULL, NULL, NULL, 9, N'STI', N'pi_3RbzD71JnNChU1O604NXuCPG', N'pi_3RbzD71JnNChU1O604NXuCPG', CAST(N'2025-06-20T14:18:05.9990420' AS DateTime2), 1)
INSERT [dbo].[payments] ([payment_id], [amount], [created_at], [currency], [description], [expires_at], [notes], [paid_at], [payment_method], [payment_status], [qr_code_url], [qr_payment_reference], [refund_amount], [refund_id], [refunded_at], [service_id], [service_type], [stripe_payment_intent_id], [transaction_id], [updated_at], [user_id]) VALUES (7, CAST(500000.00 AS Numeric(10, 2)), CAST(N'2025-06-20T20:07:04.1706160' AS DateTime2), N'VND', N'STI Test: Syphilis Screening', NULL, NULL, CAST(N'2025-06-20T20:07:04.1821190' AS DateTime2), N'COD', N'COMPLETED', NULL, NULL, NULL, NULL, NULL, 10, N'STI', NULL, NULL, CAST(N'2025-06-20T20:07:04.1853000' AS DateTime2), 1)
SET IDENTITY_INSERT [dbo].[payments] OFF
GO
SET IDENTITY_INSERT [dbo].[pregnancy_prob_log] ON 

INSERT [dbo].[pregnancy_prob_log] ([id], [date], [probability], [menstrual_cycle_id]) VALUES (1, CAST(N'2025-06-23' AS Date), 6.4, 1)
INSERT [dbo].[pregnancy_prob_log] ([id], [date], [probability], [menstrual_cycle_id]) VALUES (2, CAST(N'2025-06-24' AS Date), 7.8, 1)
INSERT [dbo].[pregnancy_prob_log] ([id], [date], [probability], [menstrual_cycle_id]) VALUES (3, CAST(N'2025-06-25' AS Date), 10.7, 1)
INSERT [dbo].[pregnancy_prob_log] ([id], [date], [probability], [menstrual_cycle_id]) VALUES (4, CAST(N'2025-06-26' AS Date), 19.3, 1)
INSERT [dbo].[pregnancy_prob_log] ([id], [date], [probability], [menstrual_cycle_id]) VALUES (5, CAST(N'2025-06-27' AS Date), 23.5, 1)
INSERT [dbo].[pregnancy_prob_log] ([id], [date], [probability], [menstrual_cycle_id]) VALUES (6, CAST(N'2025-06-28' AS Date), 15.7, 1)
INSERT [dbo].[pregnancy_prob_log] ([id], [date], [probability], [menstrual_cycle_id]) VALUES (7, CAST(N'2025-06-29' AS Date), 5.7, 1)
SET IDENTITY_INSERT [dbo].[pregnancy_prob_log] OFF
GO
SET IDENTITY_INSERT [dbo].[rating_summary] ON 

INSERT [dbo].[rating_summary] ([summary_id], [average_rating], [five_star_count], [four_star_count], [last_updated], [one_star_count], [target_id], [target_type], [three_star_count], [total_ratings], [two_star_count]) VALUES (1, CAST(5.0 AS Numeric(2, 1)), 1, 0, CAST(N'2025-06-15T00:57:37.3588920' AS DateTime2), 0, 1, N'STI_SERVICE', 0, 1, 0)
INSERT [dbo].[rating_summary] ([summary_id], [average_rating], [five_star_count], [four_star_count], [last_updated], [one_star_count], [target_id], [target_type], [three_star_count], [total_ratings], [two_star_count]) VALUES (4, CAST(4.0 AS Numeric(2, 1)), 0, 1, CAST(N'2025-06-17T08:30:34.6444170' AS DateTime2), 0, 3, N'STI_PACKAGE', 0, 1, 0)
INSERT [dbo].[rating_summary] ([summary_id], [average_rating], [five_star_count], [four_star_count], [last_updated], [one_star_count], [target_id], [target_type], [three_star_count], [total_ratings], [two_star_count]) VALUES (5, CAST(5.0 AS Numeric(2, 1)), 1, 0, CAST(N'2025-06-20T20:24:35.3585300' AS DateTime2), 0, 2, N'STI_SERVICE', 0, 1, 0)
SET IDENTITY_INSERT [dbo].[rating_summary] OFF
GO
SET IDENTITY_INSERT [dbo].[ratings] ON 

INSERT [dbo].[ratings] ([rating_id], [comment], [consultation_id], [created_at], [is_active], [rating], [replied_at], [staff_reply], [sti_test_id], [target_id], [target_type], [updated_at], [replied_by], [user_id]) VALUES (1, N'Tốt. Giá cả phải chăng, trả kết quả xét nghiệm nhanh và chính xác.', NULL, CAST(N'2025-06-15T00:40:56.1715630' AS DateTime2), 0, 5, NULL, NULL, 1, 1, N'STI_SERVICE', CAST(N'2025-06-15T00:57:14.3032640' AS DateTime2), NULL, 1)
INSERT [dbo].[ratings] ([rating_id], [comment], [consultation_id], [created_at], [is_active], [rating], [replied_at], [staff_reply], [sti_test_id], [target_id], [target_type], [updated_at], [replied_by], [user_id]) VALUES (2, N'TỐT, thời gian xét nghiệm nhanh chóng, kết quả chính xác', NULL, CAST(N'2025-06-15T00:57:37.3483760' AS DateTime2), 1, 5, CAST(N'2025-06-17T11:25:10.7059220' AS DateTime2), N'OK!', 1, 1, N'STI_SERVICE', CAST(N'2025-06-17T11:25:10.7120210' AS DateTime2), 3, 1)
INSERT [dbo].[ratings] ([rating_id], [comment], [consultation_id], [created_at], [is_active], [rating], [replied_at], [staff_reply], [sti_test_id], [target_id], [target_type], [updated_at], [replied_by], [user_id]) VALUES (6, N'Kết quả không được chính xác lắm. Tạm !', NULL, CAST(N'2025-06-17T08:30:21.8992100' AS DateTime2), 1, 4, CAST(N'2025-06-17T11:47:29.1437360' AS DateTime2), N'Cảm ơn !!!!', 7, 3, N'STI_PACKAGE', CAST(N'2025-06-17T11:47:29.1597340' AS DateTime2), 3, 1)
INSERT [dbo].[ratings] ([rating_id], [comment], [consultation_id], [created_at], [is_active], [rating], [replied_at], [staff_reply], [sti_test_id], [target_id], [target_type], [updated_at], [replied_by], [user_id]) VALUES (7, N'Tốt! Thời gian trả kết quả nhanh, độ chính xác cao. Nhân viên hướng dẫn nhiệt tình.', NULL, CAST(N'2025-06-20T20:24:35.3184860' AS DateTime2), 1, 5, NULL, NULL, 10, 2, N'STI_SERVICE', CAST(N'2025-06-20T20:24:35.3184860' AS DateTime2), NULL, 1)
SET IDENTITY_INSERT [dbo].[ratings] OFF
GO
SET IDENTITY_INSERT [dbo].[roles] ON 

INSERT [dbo].[roles] ([role_id], [created_at], [description], [role_name], [updated_at]) VALUES (1, CAST(N'2025-06-15T00:08:18.2045350' AS DateTime2), N'Regular customer role', N'CUSTOMER', CAST(N'2025-06-21T06:05:16.5429300' AS DateTime2))
INSERT [dbo].[roles] ([role_id], [created_at], [description], [role_name], [updated_at]) VALUES (2, CAST(N'2025-06-15T00:08:18.2600250' AS DateTime2), N'Consultant role', N'CONSULTANT', CAST(N'2025-06-21T06:05:16.5727870' AS DateTime2))
INSERT [dbo].[roles] ([role_id], [created_at], [description], [role_name], [updated_at]) VALUES (3, CAST(N'2025-06-15T00:08:18.2664830' AS DateTime2), N'Staff role', N'STAFF', CAST(N'2025-06-21T06:05:16.5817870' AS DateTime2))
INSERT [dbo].[roles] ([role_id], [created_at], [description], [role_name], [updated_at]) VALUES (4, CAST(N'2025-06-15T00:08:18.2729960' AS DateTime2), N'Administrator role', N'ADMIN', CAST(N'2025-06-21T06:05:16.5927870' AS DateTime2))
SET IDENTITY_INSERT [dbo].[roles] OFF
GO
SET IDENTITY_INSERT [dbo].[service_test_components] ON 

INSERT [dbo].[service_test_components] ([component_id], [created_at], [reference_range], [test_name], [updated_at], [service_id], [status]) VALUES (1, CAST(N'2025-06-15T00:17:31.9548470' AS DateTime2), N'Negative', N'HIV Ag (p24)', CAST(N'2025-06-15T00:17:31.9548470' AS DateTime2), 1, 1)
INSERT [dbo].[service_test_components] ([component_id], [created_at], [reference_range], [test_name], [updated_at], [service_id], [status]) VALUES (2, CAST(N'2025-06-15T00:17:31.9634130' AS DateTime2), N'Negative', N'HIV Antibody (HIV-1/HIV-2)', CAST(N'2025-06-15T00:17:31.9634130' AS DateTime2), 1, 1)
INSERT [dbo].[service_test_components] ([component_id], [created_at], [reference_range], [test_name], [updated_at], [service_id], [status]) VALUES (3, CAST(N'2025-06-15T00:20:46.0844480' AS DateTime2), N'Negative', N'RPR (Rapid Plasma Reagin)', CAST(N'2025-06-15T00:20:46.0844480' AS DateTime2), 2, 1)
INSERT [dbo].[service_test_components] ([component_id], [created_at], [reference_range], [test_name], [updated_at], [service_id], [status]) VALUES (4, CAST(N'2025-06-15T00:20:46.0938720' AS DateTime2), N'Negative', N'TPHA', CAST(N'2025-06-15T00:20:46.0938720' AS DateTime2), 2, 1)
INSERT [dbo].[service_test_components] ([component_id], [created_at], [reference_range], [test_name], [updated_at], [service_id], [status]) VALUES (5, CAST(N'2025-06-15T00:20:46.0970640' AS DateTime2), N'Negative', N'VDRL', CAST(N'2025-06-15T00:20:46.0970640' AS DateTime2), 2, 1)
INSERT [dbo].[service_test_components] ([component_id], [created_at], [reference_range], [test_name], [updated_at], [service_id], [status]) VALUES (6, CAST(N'2025-06-15T00:20:46.1015850' AS DateTime2), N'Negative', N'FTA-ABS', CAST(N'2025-06-15T00:20:46.1015850' AS DateTime2), 2, 1)
INSERT [dbo].[service_test_components] ([component_id], [created_at], [reference_range], [test_name], [updated_at], [service_id], [status]) VALUES (7, CAST(N'2025-06-20T20:06:02.9922950' AS DateTime2), N'10', N'Test in active Status', CAST(N'2025-06-20T20:06:14.8224780' AS DateTime2), 1, 0)
SET IDENTITY_INSERT [dbo].[service_test_components] OFF
GO
SET IDENTITY_INSERT [dbo].[sti_packages] ON 

INSERT [dbo].[sti_packages] ([package_id], [created_at], [description], [is_active], [package_name], [package_price], [updated_at]) VALUES (3, CAST(N'2025-06-15T02:22:18.1360080' AS DateTime2), N'Gói xét nghiệm toàn diện để sàng lọc và chẩn đoán nhiễm HIV và bệnh giang mai, phù hợp cho người có nguy cơ lây nhiễm qua đường tình dục. Gói này bao gồm xét nghiệm kháng nguyên và kháng thể HIV (HIV Ag (p24) và HIV Antibody (HIV-1/HIV-2)) để phát hiện HIV ở giai đoạn sớm và muộn, cùng với các xét nghiệm không đặc hiệu (RPR, VDRL) và đặc hiệu (TPHA, FTA-ABS) để chẩn đoán giang mai ở mọi giai đoạn. Gói combo giúp tiết kiệm chi phí so với làm từng xét nghiệm riêng lẻ và cung cấp kết quả toàn diện.', 1, N'COMBO HIV + GIang Mai', CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T02:36:05.2564680' AS DateTime2))
SET IDENTITY_INSERT [dbo].[sti_packages] OFF
GO
SET IDENTITY_INSERT [dbo].[sti_services] ON 

INSERT [dbo].[sti_services] ([service_id], [created_at], [description], [is_active], [name], [price], [updated_at]) VALUES (1, CAST(N'2025-06-15T00:17:31.9443920' AS DateTime2), N'Xét nghiệm phát hiện nhiễm HIV ở giai đoạn sớm (11-14 ngày sau phơi nhiễm) và giai đoạn muộn, bao gồm kiểm tra kháng nguyên p24 và kháng thể HIV-1/HIV-2.', 1, N'HIV Ag/Ab Combo', 500000, CAST(N'2025-06-15T00:17:31.9443920' AS DateTime2))
INSERT [dbo].[sti_services] ([service_id], [created_at], [description], [is_active], [name], [price], [updated_at]) VALUES (2, CAST(N'2025-06-15T00:20:46.0768660' AS DateTime2), N'Xét nghiệm sàng lọc bệnh giang mai, phát hiện kháng thể chống vi khuẩn Treponema pallidum.', 1, N'Syphilis Screening', 500000, CAST(N'2025-06-15T00:20:46.0768660' AS DateTime2))
SET IDENTITY_INSERT [dbo].[sti_services] OFF
GO
SET IDENTITY_INSERT [dbo].[sti_tests] ON 

INSERT [dbo].[sti_tests] ([test_id], [appointment_date], [consultant_notes], [created_at], [customer_notes], [result_date], [status], [total_price], [updated_at], [consultant_id], [customer_id], [staff_id], [service_id], [package_id]) VALUES (1, CAST(N'2025-06-16T10:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-15T00:34:11.2459330' AS DateTime2), N'', CAST(N'2025-06-15T00:39:48.9886690' AS DateTime2), N'COMPLETED', CAST(500000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T00:39:53.6092910' AS DateTime2), 3, 1, 3, 1, NULL)
INSERT [dbo].[sti_tests] ([test_id], [appointment_date], [consultant_notes], [created_at], [customer_notes], [result_date], [status], [total_price], [updated_at], [consultant_id], [customer_id], [staff_id], [service_id], [package_id]) VALUES (5, CAST(N'2025-06-17T02:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-15T03:31:03.5542890' AS DateTime2), N'test visa', CAST(N'2025-06-15T09:41:34.0046310' AS DateTime2), N'RESULTED', CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T09:41:34.0123040' AS DateTime2), 3, 1, 3, NULL, 3)
INSERT [dbo].[sti_tests] ([test_id], [appointment_date], [consultant_notes], [created_at], [customer_notes], [result_date], [status], [total_price], [updated_at], [consultant_id], [customer_id], [staff_id], [service_id], [package_id]) VALUES (6, CAST(N'2025-06-17T02:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-15T03:32:14.5091390' AS DateTime2), N'test QR', NULL, N'CANCELED', CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-15T10:36:01.2151400' AS DateTime2), NULL, 1, NULL, NULL, 3)
INSERT [dbo].[sti_tests] ([test_id], [appointment_date], [consultant_notes], [created_at], [customer_notes], [result_date], [status], [total_price], [updated_at], [consultant_id], [customer_id], [staff_id], [service_id], [package_id]) VALUES (7, CAST(N'2025-06-21T02:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-15T10:18:06.1867350' AS DateTime2), N'test123', CAST(N'2025-06-15T10:18:42.9423830' AS DateTime2), N'COMPLETED', CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-17T08:05:46.6071990' AS DateTime2), 3, 1, 3, NULL, 3)
INSERT [dbo].[sti_tests] ([test_id], [appointment_date], [consultant_notes], [created_at], [customer_notes], [result_date], [status], [total_price], [updated_at], [consultant_id], [customer_id], [staff_id], [service_id], [package_id]) VALUES (8, CAST(N'2025-06-24T09:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-19T21:13:08.7715650' AS DateTime2), N'123', NULL, N'SAMPLED', CAST(500000.00 AS Numeric(10, 2)), CAST(N'2025-06-19T21:13:26.3271660' AS DateTime2), 3, 1, 3, 2, NULL)
INSERT [dbo].[sti_tests] ([test_id], [appointment_date], [consultant_notes], [created_at], [customer_notes], [result_date], [status], [total_price], [updated_at], [consultant_id], [customer_id], [staff_id], [service_id], [package_id]) VALUES (9, CAST(N'2025-06-23T03:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-20T14:18:04.0524390' AS DateTime2), N'123123', NULL, N'SAMPLED', CAST(800000.00 AS Numeric(10, 2)), CAST(N'2025-06-20T20:07:23.0450890' AS DateTime2), 3, 1, 3, NULL, 3)
INSERT [dbo].[sti_tests] ([test_id], [appointment_date], [consultant_notes], [created_at], [customer_notes], [result_date], [status], [total_price], [updated_at], [consultant_id], [customer_id], [staff_id], [service_id], [package_id]) VALUES (10, CAST(N'2025-06-22T11:00:00.0000000' AS DateTime2), NULL, CAST(N'2025-06-20T20:07:04.1384670' AS DateTime2), N'test', CAST(N'2025-06-20T20:07:46.6281710' AS DateTime2), N'COMPLETED', CAST(500000.00 AS Numeric(10, 2)), CAST(N'2025-06-20T20:07:48.4953430' AS DateTime2), 3, 1, 3, 2, NULL)
SET IDENTITY_INSERT [dbo].[sti_tests] OFF
GO
SET IDENTITY_INSERT [dbo].[test_results] ON 

INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (1, CAST(N'2025-06-15T00:39:48.9811620' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T00:39:48.9796590' AS DateTime2), 3, N'', CAST(N'2025-06-15T00:39:48.9811620' AS DateTime2), 1, 1, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (2, CAST(N'2025-06-15T00:39:48.9871660' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T00:39:48.9871660' AS DateTime2), 3, N'', CAST(N'2025-06-15T00:39:48.9871660' AS DateTime2), 1, 2, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (15, CAST(N'2025-06-15T03:31:03.5782910' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:31:03.5782910' AS DateTime2), 5, 1, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (16, CAST(N'2025-06-15T03:31:03.5843110' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:31:03.5843110' AS DateTime2), 5, 2, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (17, CAST(N'2025-06-15T03:31:03.5872890' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:31:03.5872890' AS DateTime2), 5, 3, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (18, CAST(N'2025-06-15T03:31:03.5883120' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:31:03.5883120' AS DateTime2), 5, 4, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (19, CAST(N'2025-06-15T03:31:03.5892900' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:31:03.5892900' AS DateTime2), 5, 5, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (20, CAST(N'2025-06-15T03:31:03.5913340' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:31:03.5913340' AS DateTime2), 5, 6, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (21, CAST(N'2025-06-15T03:32:14.5165930' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:32:14.5165930' AS DateTime2), 6, 1, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (22, CAST(N'2025-06-15T03:32:14.5215890' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:32:14.5215890' AS DateTime2), 6, 2, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (23, CAST(N'2025-06-15T03:32:14.5246050' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:32:14.5246050' AS DateTime2), 6, 3, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (24, CAST(N'2025-06-15T03:32:14.5265990' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:32:14.5265990' AS DateTime2), 6, 4, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (25, CAST(N'2025-06-15T03:32:14.5276930' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:32:14.5276930' AS DateTime2), 6, 5, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (26, CAST(N'2025-06-15T03:32:14.5297030' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-15T03:32:14.5297030' AS DateTime2), 6, 6, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (27, CAST(N'2025-06-15T09:41:33.8398650' AS DateTime2), N'4', N'4', CAST(N'2025-06-15T09:41:33.8274070' AS DateTime2), 3, N'', CAST(N'2025-06-15T09:41:33.8398650' AS DateTime2), 5, 1, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (28, CAST(N'2025-06-15T09:41:33.9861870' AS DateTime2), N'4', N'4', CAST(N'2025-06-15T09:41:33.9861870' AS DateTime2), 3, N'', CAST(N'2025-06-15T09:41:33.9861870' AS DateTime2), 5, 2, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (29, CAST(N'2025-06-15T09:41:33.9882110' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T09:41:33.9882110' AS DateTime2), 3, N'', CAST(N'2025-06-15T09:41:33.9882110' AS DateTime2), 5, 3, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (30, CAST(N'2025-06-15T09:41:33.9892130' AS DateTime2), N'2', N'2', CAST(N'2025-06-15T09:41:33.9892130' AS DateTime2), 3, N'', CAST(N'2025-06-15T09:41:33.9892130' AS DateTime2), 5, 4, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (31, CAST(N'2025-06-15T09:41:33.9912150' AS DateTime2), N'3', N'3', CAST(N'2025-06-15T09:41:33.9912150' AS DateTime2), 3, N'', CAST(N'2025-06-15T09:41:33.9912150' AS DateTime2), 5, 5, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (32, CAST(N'2025-06-15T09:41:33.9922080' AS DateTime2), N'4', N'4', CAST(N'2025-06-15T09:41:33.9922080' AS DateTime2), 3, N'', CAST(N'2025-06-15T09:41:33.9922080' AS DateTime2), 5, 6, NULL)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (33, CAST(N'2025-06-15T10:18:06.2288930' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T10:18:42.9063750' AS DateTime2), 3, N'', CAST(N'2025-06-15T10:18:42.9083700' AS DateTime2), 7, 1, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (34, CAST(N'2025-06-15T10:18:06.2344750' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T10:18:42.9220400' AS DateTime2), 3, N'', CAST(N'2025-06-15T10:18:42.9239870' AS DateTime2), 7, 2, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (35, CAST(N'2025-06-15T10:18:06.2370820' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T10:18:42.9278130' AS DateTime2), 3, N'', CAST(N'2025-06-15T10:18:42.9287960' AS DateTime2), 7, 3, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (36, CAST(N'2025-06-15T10:18:06.2391730' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T10:18:42.9322420' AS DateTime2), 3, N'', CAST(N'2025-06-15T10:18:42.9342780' AS DateTime2), 7, 4, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (37, CAST(N'2025-06-15T10:18:06.2401890' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T10:18:42.9373680' AS DateTime2), 3, N'', CAST(N'2025-06-15T10:18:42.9393660' AS DateTime2), 7, 5, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (38, CAST(N'2025-06-15T10:18:06.2421870' AS DateTime2), N'1', N'1', CAST(N'2025-06-15T10:18:42.9423830' AS DateTime2), 3, N'', CAST(N'2025-06-15T10:18:42.9508780' AS DateTime2), 7, 6, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (39, CAST(N'2025-06-19T21:13:08.8353870' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-19T21:13:08.8353870' AS DateTime2), 8, 3, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (40, CAST(N'2025-06-19T21:13:08.8434000' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-19T21:13:08.8434000' AS DateTime2), 8, 4, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (41, CAST(N'2025-06-19T21:13:08.8459150' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-19T21:13:08.8459150' AS DateTime2), 8, 5, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (42, CAST(N'2025-06-19T21:13:08.8484070' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-19T21:13:08.8484070' AS DateTime2), 8, 6, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (43, CAST(N'2025-06-20T14:18:04.0928120' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-20T14:18:04.0928120' AS DateTime2), 9, 1, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (44, CAST(N'2025-06-20T14:18:04.1015480' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-20T14:18:04.1015480' AS DateTime2), 9, 2, 1)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (45, CAST(N'2025-06-20T14:18:04.1045290' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-20T14:18:04.1045290' AS DateTime2), 9, 3, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (46, CAST(N'2025-06-20T14:18:04.1055140' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-20T14:18:04.1055140' AS DateTime2), 9, 4, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (47, CAST(N'2025-06-20T14:18:04.1075150' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-20T14:18:04.1075150' AS DateTime2), 9, 5, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (48, CAST(N'2025-06-20T14:18:04.1095300' AS DateTime2), NULL, NULL, NULL, NULL, NULL, CAST(N'2025-06-20T14:18:04.1095300' AS DateTime2), 9, 6, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (49, CAST(N'2025-06-20T20:07:04.1560670' AS DateTime2), N'1', N'1', CAST(N'2025-06-20T20:07:46.5997780' AS DateTime2), 3, N'', CAST(N'2025-06-20T20:07:46.6037820' AS DateTime2), 10, 3, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (50, CAST(N'2025-06-20T20:07:04.1630650' AS DateTime2), N'1', N'1', CAST(N'2025-06-20T20:07:46.6112940' AS DateTime2), 3, N'', CAST(N'2025-06-20T20:07:46.6141400' AS DateTime2), 10, 4, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (51, CAST(N'2025-06-20T20:07:04.1645740' AS DateTime2), N'1', N'1', CAST(N'2025-06-20T20:07:46.6174370' AS DateTime2), 3, N'', CAST(N'2025-06-20T20:07:46.6194350' AS DateTime2), 10, 5, 2)
INSERT [dbo].[test_results] ([result_id], [created_at], [normal_range], [result_value], [reviewed_at], [reviewed_by], [unit], [updated_at], [test_id], [component_id], [source_service_id]) VALUES (52, CAST(N'2025-06-20T20:07:04.1655770' AS DateTime2), N'1', N'1', CAST(N'2025-06-20T20:07:46.6271690' AS DateTime2), 3, N'', CAST(N'2025-06-20T20:07:46.6332120' AS DateTime2), 10, 6, 2)
SET IDENTITY_INSERT [dbo].[test_results] OFF
GO
SET IDENTITY_INSERT [dbo].[user] ON 

INSERT [dbo].[user] ([id], [avatar], [birth_day], [created_date], [email], [full_name], [gender], [is_active], [password], [phone], [username], [role_id]) VALUES (1, N'/img/avatar/user_1_20250619_192118.jpg', CAST(N'2004-03-02' AS Date), CAST(N'2025-06-15T00:10:37.7533150' AS DateTime2), N'alicek23004@gmail.com', N'Lucia', N'FEMALE', 1, N'$2a$10$tS7/.5CIKSeqS3A6hvAUWOUVyRv8PHc/xixx13D0yDk4QubJM/eqW', N'0349079940_V', N'lucia123', 1)
INSERT [dbo].[user] ([id], [avatar], [birth_day], [created_date], [email], [full_name], [gender], [is_active], [password], [phone], [username], [role_id]) VALUES (2, N'/img/avatar/default.jpg', CAST(N'2004-03-02' AS Date), CAST(N'2025-06-15T00:11:33.4146260' AS DateTime2), N'alicek02032004@gmail.com', N'Consultant', N'FEMALE', 1, N'$2a$10$0RV/y0fvvBC/Zd/Z9m7WmupzGU5eXzFVKlsEKXJuDT15JLZ4NZQoy', N'1234567890', N'consultant123', 2)
INSERT [dbo].[user] ([id], [avatar], [birth_day], [created_date], [email], [full_name], [gender], [is_active], [password], [phone], [username], [role_id]) VALUES (3, N'/img/avatar/user_3_20250619_192231.jpg', CAST(N'2004-03-02' AS Date), CAST(N'2025-06-15T00:12:21.6378780' AS DateTime2), N'hotramkhang21@gmail.com', N'Staff', N'MALE', 1, N'$2a$10$LDXkRpvOz8tCUQgCm0Q1m.HQFeWfLBKNyQQqEDPJmx3GvTeMyBBj2', N'1234567890', N'staff123', 3)
INSERT [dbo].[user] ([id], [avatar], [birth_day], [created_date], [email], [full_name], [gender], [is_active], [password], [phone], [username], [role_id]) VALUES (4, N'/img/avatar/default.jpg', CAST(N'2004-03-02' AS Date), CAST(N'2025-06-15T00:13:00.4074630' AS DateTime2), N'hotramkhang08@gmail.com', N'Admin', N'MALE', 1, N'$2a$10$TpnabbAv5LXLNDP8KM0qjuWS6fjL7Pf615B6WUxz9nTNEM9ydWFIG', N'1234567890', N'admin123', 4)
INSERT [dbo].[user] ([id], [avatar], [birth_day], [created_date], [email], [full_name], [gender], [is_active], [password], [phone], [username], [role_id]) VALUES (5, N'/img/avatar/default.jpg', CAST(N'2000-10-10' AS Date), CAST(N'2025-06-18T07:26:35.2606990' AS DateTime2), N'testuser123@gmail.com', N'Test User', N'MALE', 0, N'$2a$10$ZLl15S7w5kwJYvFxN8o9BuqUY9j3lB0MOgEK/JJyXF.H6yfDTOn8C', N'0123210000', N'user123', 1)
INSERT [dbo].[user] ([id], [avatar], [birth_day], [created_date], [email], [full_name], [gender], [is_active], [password], [phone], [username], [role_id]) VALUES (6, N'/img/avatar/default.jpg', CAST(N'1999-09-09' AS Date), CAST(N'2025-06-18T07:43:02.5664030' AS DateTime2), N'testconsultant123@gmail.com', N'Test Consultant', N'MALE', 0, N'$2a$10$jGReguwFt0jcUYtbQJaob.dSqYWe6BhQPrhmunD6XjZdHz7s0zl4W', N'0009998887', N'testconsultant123', 2)
SET IDENTITY_INSERT [dbo].[user] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UKt8o6pivur7nn124jehx7cygw5]    Script Date: 6/21/2025 6:29:10 AM ******/
ALTER TABLE [dbo].[categories] ADD  CONSTRAINT [UKt8o6pivur7nn124jehx7cygw5] UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UK2p0xo5atum9fbuss9c2naglh]    Script Date: 6/21/2025 6:29:10 AM ******/
ALTER TABLE [dbo].[category_questions] ADD  CONSTRAINT [UK2p0xo5atum9fbuss9c2naglh] UNIQUE NONCLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UKedxymbn5wxe19qtov8j1233o6]    Script Date: 6/21/2025 6:29:10 AM ******/
ALTER TABLE [dbo].[consultant_profiles] ADD  CONSTRAINT [UKedxymbn5wxe19qtov8j1233o6] UNIQUE NONCLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UK716hgxp60ym1lifrdgp67xt5k]    Script Date: 6/21/2025 6:29:10 AM ******/
ALTER TABLE [dbo].[roles] ADD  CONSTRAINT [UK716hgxp60ym1lifrdgp67xt5k] UNIQUE NONCLUSTERED 
(
	[role_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UK5c856itaihtmi69ni04cmpc4m]    Script Date: 6/21/2025 6:29:10 AM ******/
ALTER TABLE [dbo].[user] ADD  CONSTRAINT [UK5c856itaihtmi69ni04cmpc4m] UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UKhl4ga9r00rh51mdaf20hmnslt]    Script Date: 6/21/2025 6:29:10 AM ******/
ALTER TABLE [dbo].[user] ADD  CONSTRAINT [UKhl4ga9r00rh51mdaf20hmnslt] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[service_test_components] ADD  DEFAULT ((1)) FOR [status]
GO
ALTER TABLE [dbo].[app_config]  WITH CHECK ADD  CONSTRAINT [FKbmr0megv3xecgjibwhwjbwj63] FOREIGN KEY([updated_by])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[app_config] CHECK CONSTRAINT [FKbmr0megv3xecgjibwhwjbwj63]
GO
ALTER TABLE [dbo].[blog_posts]  WITH CHECK ADD  CONSTRAINT [FK8pony6gy2gjgt4w4woncvcdm6] FOREIGN KEY([reviewer_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[blog_posts] CHECK CONSTRAINT [FK8pony6gy2gjgt4w4woncvcdm6]
GO
ALTER TABLE [dbo].[blog_posts]  WITH CHECK ADD  CONSTRAINT [FK9mh2nwyl2h7qt76ulxv4kxiyr] FOREIGN KEY([author_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[blog_posts] CHECK CONSTRAINT [FK9mh2nwyl2h7qt76ulxv4kxiyr]
GO
ALTER TABLE [dbo].[blog_posts]  WITH CHECK ADD  CONSTRAINT [FKec6vfo066ln77ls1fqjp3kymp] FOREIGN KEY([category_id])
REFERENCES [dbo].[categories] ([category_id])
GO
ALTER TABLE [dbo].[blog_posts] CHECK CONSTRAINT [FKec6vfo066ln77ls1fqjp3kymp]
GO
ALTER TABLE [dbo].[blog_sections]  WITH CHECK ADD  CONSTRAINT [FKp23y9paqu2k1uih3je8quo6kj] FOREIGN KEY([post_id])
REFERENCES [dbo].[blog_posts] ([post_id])
GO
ALTER TABLE [dbo].[blog_sections] CHECK CONSTRAINT [FKp23y9paqu2k1uih3je8quo6kj]
GO
ALTER TABLE [dbo].[consultant_profiles]  WITH CHECK ADD  CONSTRAINT [FK272ng080h81io7t0exrk03a5a] FOREIGN KEY([user_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[consultant_profiles] CHECK CONSTRAINT [FK272ng080h81io7t0exrk03a5a]
GO
ALTER TABLE [dbo].[consultations]  WITH CHECK ADD  CONSTRAINT [FK94id93tit4knpfka19bliseq2] FOREIGN KEY([customer_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[consultations] CHECK CONSTRAINT [FK94id93tit4knpfka19bliseq2]
GO
ALTER TABLE [dbo].[consultations]  WITH CHECK ADD  CONSTRAINT [FKhlujsmd5ncv3024yur7qjwv4y] FOREIGN KEY([consultant_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[consultations] CHECK CONSTRAINT [FKhlujsmd5ncv3024yur7qjwv4y]
GO
ALTER TABLE [dbo].[menstrual_cycle]  WITH CHECK ADD  CONSTRAINT [FKg7yq2w7ed0v9atf9y6xr24i08] FOREIGN KEY([user_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[menstrual_cycle] CHECK CONSTRAINT [FKg7yq2w7ed0v9atf9y6xr24i08]
GO
ALTER TABLE [dbo].[package_services]  WITH CHECK ADD  CONSTRAINT [FK6gmxbaal73kgj9y46umpf2o7q] FOREIGN KEY([service_id])
REFERENCES [dbo].[sti_services] ([service_id])
GO
ALTER TABLE [dbo].[package_services] CHECK CONSTRAINT [FK6gmxbaal73kgj9y46umpf2o7q]
GO
ALTER TABLE [dbo].[package_services]  WITH CHECK ADD  CONSTRAINT [FK8ha9quf1i49hnscfp9vww99ow] FOREIGN KEY([package_id])
REFERENCES [dbo].[sti_packages] ([package_id])
GO
ALTER TABLE [dbo].[package_services] CHECK CONSTRAINT [FK8ha9quf1i49hnscfp9vww99ow]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [FKsymuhm59ps2g1r7rx3kehim7h] FOREIGN KEY([service_id])
REFERENCES [dbo].[sti_tests] ([test_id])
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [FKsymuhm59ps2g1r7rx3kehim7h]
GO
ALTER TABLE [dbo].[pregnancy_prob_log]  WITH CHECK ADD  CONSTRAINT [FKqh1dyxsdd0j5doxmgdguvqmd7] FOREIGN KEY([menstrual_cycle_id])
REFERENCES [dbo].[menstrual_cycle] ([cycle_id])
GO
ALTER TABLE [dbo].[pregnancy_prob_log] CHECK CONSTRAINT [FKqh1dyxsdd0j5doxmgdguvqmd7]
GO
ALTER TABLE [dbo].[questions]  WITH CHECK ADD  CONSTRAINT [FK1w7bfhmqilfl6cdqe5f0n1sbr] FOREIGN KEY([replier_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[questions] CHECK CONSTRAINT [FK1w7bfhmqilfl6cdqe5f0n1sbr]
GO
ALTER TABLE [dbo].[questions]  WITH CHECK ADD  CONSTRAINT [FK42ysfjv9obd82hq8u6xangvds] FOREIGN KEY([updater_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[questions] CHECK CONSTRAINT [FK42ysfjv9obd82hq8u6xangvds]
GO
ALTER TABLE [dbo].[questions]  WITH CHECK ADD  CONSTRAINT [FKh8xn78hi09urdresjl9mwfsog] FOREIGN KEY([customer_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[questions] CHECK CONSTRAINT [FKh8xn78hi09urdresjl9mwfsog]
GO
ALTER TABLE [dbo].[questions]  WITH CHECK ADD  CONSTRAINT [FKrjj401o4xvl7eblpt1bgx2k3l] FOREIGN KEY([category_question_id])
REFERENCES [dbo].[category_questions] ([category_question_id])
GO
ALTER TABLE [dbo].[questions] CHECK CONSTRAINT [FKrjj401o4xvl7eblpt1bgx2k3l]
GO
ALTER TABLE [dbo].[ratings]  WITH CHECK ADD  CONSTRAINT [FK6ty05h07soi6wpf2ycxtorbd7] FOREIGN KEY([user_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[ratings] CHECK CONSTRAINT [FK6ty05h07soi6wpf2ycxtorbd7]
GO
ALTER TABLE [dbo].[ratings]  WITH CHECK ADD  CONSTRAINT [FKkn4xl88x0vpv4ag33me6bnulf] FOREIGN KEY([replied_by])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[ratings] CHECK CONSTRAINT [FKkn4xl88x0vpv4ag33me6bnulf]
GO
ALTER TABLE [dbo].[service_test_components]  WITH CHECK ADD  CONSTRAINT [FK8ygioamogvpyieal02vegsxt5] FOREIGN KEY([service_id])
REFERENCES [dbo].[sti_services] ([service_id])
GO
ALTER TABLE [dbo].[service_test_components] CHECK CONSTRAINT [FK8ygioamogvpyieal02vegsxt5]
GO
ALTER TABLE [dbo].[sti_tests]  WITH CHECK ADD  CONSTRAINT [FKb762mjxiep1jrcvuovoljf5vh] FOREIGN KEY([package_id])
REFERENCES [dbo].[sti_packages] ([package_id])
GO
ALTER TABLE [dbo].[sti_tests] CHECK CONSTRAINT [FKb762mjxiep1jrcvuovoljf5vh]
GO
ALTER TABLE [dbo].[sti_tests]  WITH CHECK ADD  CONSTRAINT [FKh1rl7wfl5nu1ffce3rbulamoo] FOREIGN KEY([service_id])
REFERENCES [dbo].[sti_services] ([service_id])
GO
ALTER TABLE [dbo].[sti_tests] CHECK CONSTRAINT [FKh1rl7wfl5nu1ffce3rbulamoo]
GO
ALTER TABLE [dbo].[sti_tests]  WITH CHECK ADD  CONSTRAINT [FKl0uvvp0eyk8hkk5tc6tqs829n] FOREIGN KEY([customer_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[sti_tests] CHECK CONSTRAINT [FKl0uvvp0eyk8hkk5tc6tqs829n]
GO
ALTER TABLE [dbo].[sti_tests]  WITH CHECK ADD  CONSTRAINT [FKlby2pqmcj9mfkby566erods2l] FOREIGN KEY([staff_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[sti_tests] CHECK CONSTRAINT [FKlby2pqmcj9mfkby566erods2l]
GO
ALTER TABLE [dbo].[sti_tests]  WITH CHECK ADD  CONSTRAINT [FKscy1b8lak7r4usd60e0j4g9p7] FOREIGN KEY([consultant_id])
REFERENCES [dbo].[user] ([id])
GO
ALTER TABLE [dbo].[sti_tests] CHECK CONSTRAINT [FKscy1b8lak7r4usd60e0j4g9p7]
GO
ALTER TABLE [dbo].[test_results]  WITH CHECK ADD  CONSTRAINT [FK342fcmw0h2o5gvl5b3rjmq9kj] FOREIGN KEY([source_service_id])
REFERENCES [dbo].[sti_services] ([service_id])
GO
ALTER TABLE [dbo].[test_results] CHECK CONSTRAINT [FK342fcmw0h2o5gvl5b3rjmq9kj]
GO
ALTER TABLE [dbo].[test_results]  WITH CHECK ADD  CONSTRAINT [FK75e887uh1ds7okh1wt3fu51qd] FOREIGN KEY([component_id])
REFERENCES [dbo].[service_test_components] ([component_id])
GO
ALTER TABLE [dbo].[test_results] CHECK CONSTRAINT [FK75e887uh1ds7okh1wt3fu51qd]
GO
ALTER TABLE [dbo].[test_results]  WITH CHECK ADD  CONSTRAINT [FKoglsjhubh0tcwhkak9kxxww2t] FOREIGN KEY([test_id])
REFERENCES [dbo].[sti_tests] ([test_id])
GO
ALTER TABLE [dbo].[test_results] CHECK CONSTRAINT [FKoglsjhubh0tcwhkak9kxxww2t]
GO
ALTER TABLE [dbo].[user]  WITH CHECK ADD  CONSTRAINT [FKsaqc2d3hlf8olow2f8vl4r6d9] FOREIGN KEY([role_id])
REFERENCES [dbo].[roles] ([role_id])
GO
ALTER TABLE [dbo].[user] CHECK CONSTRAINT [FKsaqc2d3hlf8olow2f8vl4r6d9]
GO
ALTER TABLE [dbo].[blog_posts]  WITH CHECK ADD CHECK  (([status]='CANCELED' OR [status]='CONFIRMED' OR [status]='PROCESSING'))
GO
ALTER TABLE [dbo].[consultations]  WITH CHECK ADD CHECK  (([status]='COMPLETED' OR [status]='CANCELED' OR [status]='CONFIRMED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[menstrual_cycle]  WITH CHECK ADD CHECK  (([cycle_length]>=(1)))
GO
ALTER TABLE [dbo].[menstrual_cycle]  WITH CHECK ADD CHECK  (([number_of_days]>=(1)))
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD CHECK  (([payment_method]='QR_CODE' OR [payment_method]='VISA' OR [payment_method]='COD'))
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD CHECK  (([payment_status]='REFUNDED' OR [payment_status]='CANCELLED' OR [payment_status]='EXPIRED' OR [payment_status]='FAILED' OR [payment_status]='COMPLETED' OR [payment_status]='PROCESSING' OR [payment_status]='PENDING'))
GO
ALTER TABLE [dbo].[pregnancy_prob_log]  WITH CHECK ADD CHECK  (([probability]<=(100) AND [probability]>=(0)))
GO
ALTER TABLE [dbo].[questions]  WITH CHECK ADD CHECK  (([status]='ANSWERED' OR [status]='CANCELED' OR [status]='CONFIRMED' OR [status]='PROCESSING'))
GO
ALTER TABLE [dbo].[rating_summary]  WITH CHECK ADD  CONSTRAINT [CK__rating_su__targe__5441852A] CHECK  (([target_type]='STI_PACKAGE' OR [target_type]='CONSULTANT' OR [target_type]='STI_SERVICE'))
GO
ALTER TABLE [dbo].[rating_summary] CHECK CONSTRAINT [CK__rating_su__targe__5441852A]
GO
ALTER TABLE [dbo].[ratings]  WITH CHECK ADD  CONSTRAINT [CK__ratings__target___571DF1D5] CHECK  (([target_type]='STI_PACKAGE' OR [target_type]='STI_SERVICE' OR [target_type]='CONSULTANT'))
GO
ALTER TABLE [dbo].[ratings] CHECK CONSTRAINT [CK__ratings__target___571DF1D5]
GO
ALTER TABLE [dbo].[sti_tests]  WITH CHECK ADD CHECK  (([status]='CANCELED' OR [status]='COMPLETED' OR [status]='RESULTED' OR [status]='SAMPLED' OR [status]='CONFIRMED' OR [status]='PENDING'))
GO
ALTER TABLE [dbo].[user]  WITH CHECK ADD CHECK  (([gender]='OTHER' OR [gender]='FEMALE' OR [gender]='MALE'))
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Trạng thái hoạt động của component (1: active, 0: inactive/soft deleted)' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'service_test_components', @level2type=N'COLUMN',@level2name=N'status'
GO
USE [master]
GO
ALTER DATABASE [HealApp] SET  READ_WRITE 
GO
