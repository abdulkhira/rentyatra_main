const Card = ({ children, className = '', hover = false, onClick, ...props }) => {
  // Filter props to only include valid HTML div attributes
  const validProps = {};
  const validAttributes = ['id', 'role', 'aria-label', 'aria-labelledby', 'aria-describedby', 'data-testid', 'title'];
  validAttributes.forEach(attr => {
    if (props[attr] !== undefined) {
      validProps[attr] = props[attr];
    }
  });
  
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        hover ? 'hover:shadow-xl transition-shadow duration-300 cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...validProps}
    >
      {children}
    </div>
  );
};

export default Card;

