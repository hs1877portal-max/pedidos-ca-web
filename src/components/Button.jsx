// src/components/Button.jsx
/**
 * Componente de Botón reutilizable
 */
export default function Button({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  type = 'button' 
}) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors'
  
  const variantClasses = {
    primary: 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300'
  }
  
  const className = `${baseClasses} ${variantClasses[variant]}`
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )
}
