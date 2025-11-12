import { PROTECTED_ROUTES } from "@/routes/common/routePath"
import { Link } from "react-router-dom"

const Logo = (props: { url?: string }) => {
  return (
    <Link
      to={props.url || PROTECTED_ROUTES.OVERVIEW}
      className="flex items-center gap-2"
    >
      
      <img
        src={"/TaxgenieLogo.jpeg"}
        alt="TaxGenie Logo"
        className="h-7 w-7 object-contain rounded"
      />

      
      <span className="font-semibold text-lg text-gray-900">TaxGenie</span>
    </Link>
  )
}

export default Logo
