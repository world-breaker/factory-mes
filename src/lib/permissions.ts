// 操作工允许访问的路径前缀
const OPERATOR_ALLOWED_PREFIXES = ["/production", "/"];

// 操作工允许访问的精确路径
const OPERATOR_ALLOWED_EXACT = ["/"];

/**
 * 检查角色是否有权限访问指定路径
 */
export function canAccessPath(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  // 管理员和班组长可以访问所有页面
  if (role === "admin" || role === "supervisor") return true;
  // 操作工只能访问生产相关页面
  if (role === "operator") {
    // 允许精确匹配
    if (OPERATOR_ALLOWED_EXACT.includes(pathname)) return true;
    // 允许前缀匹配
    return OPERATOR_ALLOWED_PREFIXES.some((prefix) =>
      prefix !== "/" && pathname.startsWith(prefix)
    );
  }
  return false;
}
