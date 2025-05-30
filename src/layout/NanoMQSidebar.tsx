'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useNanoMQ } from "../context/NanoMQContext";
import {
  Activity,
  BarChart3,
  Database,
  Globe,
  Home,
  MessageSquare,
  Monitor,
  Network,
  Settings,
  Users,
  Wifi,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; badge?: string }[];
};

const navItems: NavItem[] = [
  {
    icon: <Home className="w-5 h-5" />,
    name: "仪表板",
    path: "/",
  },
  {
    icon: <Users className="w-5 h-5" />,
    name: "客户端管理",
    path: "/clients",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    name: "订阅管理",
    path: "/subscriptions",
  },
  {
    icon: <Network className="w-5 h-5" />,
    name: "消息发布",
    path: "/publish",
  },
  {
    icon: <Activity className="w-5 h-5" />,
    name: "实时监控",
    path: "/monitoring",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    name: "统计分析",
    path: "/statistics",
  },
  {
    icon: <Settings className="w-5 h-5" />,
    name: "系统配置",
    path: "/configuration",
  },
];

const NanoMQSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isConnected, brokerInfo } = useNanoMQ();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const shouldShowSidebar = isExpanded || isHovered;

  const handleMouseEnter = useCallback(() => {
    if (!isExpanded) {
      setIsHovered(true);
    }
  }, [isExpanded, setIsHovered]);

  const handleMouseLeave = useCallback(() => {
    if (!isExpanded) {
      setIsHovered(false);
    }
  }, [isExpanded, setIsHovered]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemExpanded = (itemName: string) => expandedItems.includes(itemName);

  const isActiveItem = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const hasActiveSubItem = (subItems?: { path: string }[]) => {
    return subItems?.some(item => isActiveItem(item.path)) || false;
  };

  // 自动展开包含当前路径的菜单项
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems && hasActiveSubItem(item.subItems)) {
        setExpandedItems(prev => 
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }
    });
  }, [pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out dark:bg-gray-900 dark:border-gray-800 ${
          shouldShowSidebar ? "w-[290px]" : "w-[90px]"
        } hidden lg:block`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            {shouldShowSidebar && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  NanoMQ
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Dashboard
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {shouldShowSidebar && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
            {isConnected && brokerInfo && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                版本: {brokerInfo.version}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = isItemExpanded(item.name);
            const isActive = item.path ? isActiveItem(item.path) : hasActiveSubItem(item.subItems);

            return (
              <div key={item.name}>
                {/* Main Item */}
                {item.path ? (
                  <Link
                    href={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {item.icon}
                    </div>
                    {shouldShowSidebar && (
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                    )}
                  </Link>
                ) : (
                  <button
                    onClick={() => hasSubItems && toggleExpanded(item.name)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {item.icon}
                    </div>
                    {shouldShowSidebar && (
                      <>
                        <span className="ml-3 text-sm font-medium flex-1 text-left">
                          {item.name}
                        </span>
                        {hasSubItems && (
                          <div className="w-4 h-4">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                )}

                {/* Sub Items */}
                {hasSubItems && shouldShowSidebar && isExpanded && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.subItems!.map((subItem) => (
                      <Link
                        key={subItem.path}
                        href={subItem.path}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActiveItem(subItem.path)
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{subItem.name}</span>
                        {subItem.badge && (
                          <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                            {subItem.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isMobileOpen ? "block" : "hidden"
        }`}
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed left-0 top-0 h-full w-[290px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          {/* Mobile content - same as desktop but always expanded */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  NanoMQ
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Dashboard
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Connection Status */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
            {isConnected && brokerInfo && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                版本: {brokerInfo.version}
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = isItemExpanded(item.name);
              const isActive = item.path ? isActiveItem(item.path) : hasActiveSubItem(item.subItems);

              return (
                <div key={item.name}>
                  {/* Mobile Main Item */}
                  {item.path ? (
                    <Link
                      href={item.path}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        {item.icon}
                      </div>
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => hasSubItems && toggleExpanded(item.name)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        {item.icon}
                      </div>
                      <span className="ml-3 text-sm font-medium flex-1 text-left">
                        {item.name}
                      </span>
                      {hasSubItems && (
                        <div className="w-4 h-4">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </button>
                  )}

                  {/* Mobile Sub Items */}
                  {hasSubItems && isExpanded && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.subItems!.map((subItem) => (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActiveItem(subItem.path)
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span>{subItem.name}</span>
                          {subItem.badge && (
                            <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default NanoMQSidebar;