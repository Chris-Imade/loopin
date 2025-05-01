import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, Flex, useColorModeValue, Text } from "@chakra-ui/react";
import {
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import {
  VideoCameraIcon as VideoCameraIconOutline,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconOutline,
  UserCircleIcon as UserCircleIconOutline,
} from "@heroicons/react/24/outline";
import { useUserStore } from "../../store/userStore";
import type { ReactNode } from "react";

interface NavItemProps {
  label: string;
  href: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  isActive: boolean;
  isPremiumFeature?: boolean;
  isPremium?: boolean;
}

const NavItem = ({
  label,
  href,
  icon,
  activeIcon,
  isActive,
  isPremiumFeature = false,
  isPremium = false,
}: NavItemProps) => {
  const router = useRouter();
  const bgColor = useColorModeValue("gray.100", "gray.700");
  const activeBgColor = useColorModeValue("blue.50", "blue.900");
  const activeColor = useColorModeValue("blue.500", "blue.300");
  const inactiveColor = useColorModeValue("gray.600", "gray.400");

  const handleClick = () => {
    router.push(href);
  };

  return (
    <motion.div whileTap={{ scale: 0.9 } as any} style={{ width: "100%" }}>
      <Flex
        direction="column"
        align="center"
        justify="center"
        py={3}
        px={2}
        borderRadius="md"
        cursor="pointer"
        position="relative"
        onClick={handleClick}
        role="group"
        h="70px"
      >
        {isPremiumFeature && !isPremium && (
          <Box position="absolute" top={1} right={1} color="yellow.400">
            <SparklesIcon width={12} height={12} />
          </Box>
        )}
        <Box color={isActive ? activeColor : inactiveColor}>
          {isActive ? activeIcon : icon}
        </Box>
        <Text
          fontSize="xs"
          fontWeight={isActive ? "bold" : "normal"}
          color={isActive ? activeColor : inactiveColor}
          mt={1}
        >
          {label}
        </Text>
      </Flex>
    </motion.div>
  );
};

export const BottomNav = () => {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState("/");
  const { user } = useUserStore();

  // Mock premium status - in a real app, this would come from user data
  const isPremium = user?.isPremium || false;

  useEffect(() => {
    setCurrentPath(router.pathname);
  }, [router.pathname]);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.800");

  return (
    <Box
      as={motion.div}
      initial={{ y: 100 } as any}
      animate={{ y: 0 } as any}
      transition={
        {
          type: "spring",
          stiffness: 300,
          damping: 30,
        } as any
      }
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={10}
      borderTop="1px solid"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
    >
      <Flex
        justify="space-around"
        w="100%"
        maxW="500px"
        mx="auto"
        px={4}
        py={1}
      >
        <NavItem
          label="Video"
          href="/"
          icon={<VideoCameraIconOutline width={22} height={22} />}
          activeIcon={<VideoCameraIcon width={22} height={22} />}
          isActive={currentPath === "/" || currentPath.startsWith("/video")}
        />
        <NavItem
          label="Messages"
          href="/messages"
          icon={<ChatBubbleLeftRightIconOutline width={22} height={22} />}
          activeIcon={<ChatBubbleLeftRightIcon width={22} height={22} />}
          isActive={currentPath.startsWith("/messages")}
          isPremiumFeature={true}
          isPremium={isPremium}
        />
        <NavItem
          label="Profile"
          href="/profile"
          icon={<UserCircleIconOutline width={22} height={22} />}
          activeIcon={<UserCircleIcon width={22} height={22} />}
          isActive={
            currentPath.startsWith("/profile") ||
            currentPath.startsWith("/coins")
          }
        />
      </Flex>
    </Box>
  );
};
