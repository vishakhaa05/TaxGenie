import { ChevronDown, LogOut, Sparkles, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "../ui/avatar"
  import { Button } from "../ui/button"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
        DropdownMenuTrigger,
  } from "../ui/dropdown-menu"
import { useGetSubscriptionStatusQuery } from "@/features/subscription/subscriptionAPI";
import { PROTECTED_ROUTES } from "@/routes/common/routePath";
  
export function UserNav({
  userName,
  profilePicture,
  onLogout,
}: {
  userName: string;
  profilePicture: string;
  onLogout: () => void;
}) {
  const { data: subData } = useGetSubscriptionStatusQuery();
  const plan = subData?.subscription?.plan || "FREE";
  const status = subData?.subscription?.status || "TRIALING";
  const daysRemaining = subData?.daysRemaining ?? 7;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        className="relative !bg-transparent h-8 w-8 rounded-full !gap-0"
      >
        <Avatar className="h-10 w-10 !cursor-pointer ">
          <AvatarImage
            src={profilePicture || ""}
            className="!cursor-pointer "
          />
          <AvatarFallback
            className="!bg-[var(--secondary-dark-color)] border !border-gray-700
             !text-white"
          >
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="!w-3 !h-3 ml-1 text-white" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      className="w-56 !bg-[var(--secondary-dark-color)] !text-white
       !border-gray-700
      "
      align="end"
      forceMount
    >
      <DropdownMenuLabel className="flex flex-col items-start gap-1">
        <span className="font-semibold">{userName || "TaxGenie User"}</span>
        <span className="text-[12px] text-emerald-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {status === "TRIALING" ? `7-Day Trial (${daysRemaining}d left)` : `${plan} Plan Active`}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="!bg-gray-700" />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild className="hover:!bg-gray-800 hover:!text-white cursor-pointer">
          <Link to={PROTECTED_ROUTES.SETTINGS_BILLING} className="flex items-center w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing & Plans
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="hover:!bg-gray-800 hover:!text-white cursor-pointer text-red-400"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
    </DropdownMenu>
  );
}