import { useEffect, useState, useCallback } from "react";
import { Layout } from "../components/Layout";
import { useUserStore } from "../store/userStore";
import { useCoinStore } from "../store/coinStore";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Text,
  VStack,
  Avatar,
  useColorModeValue,
  Switch,
  Badge,
  Divider,
  useToast,
  Skeleton,
  HStack,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorMode,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { motion } from "framer-motion";
import {
  SparklesIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  WifiIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/router";

// List of countries for the dropdown
const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Korea, North",
  "Korea, South",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const ProfilePage = () => {
  const { user, isLoading, signOut } = useUserStore();
  const {
    coins,
    isLoading: coinsLoading,
    isOffline,
    errorMessage,
    loadUserCoins,
    clearError,
    setOfflineStatus,
  } = useCoinStore();
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState({
    country: "",
    allowInternationalMatching: true,
    isPremium: false,
    displayName: "",
    subscriptionType: "",
  });
  const { colorMode, toggleColorMode } = useColorMode();

  // Updated subscription plans with both monthly and yearly options
  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "$0",
      features: ["Random video matching", "Limited messaging", "Basic profile"],
      current: !userData.isPremium,
    },
    {
      id: "premium-monthly",
      name: "Premium Monthly",
      price: "$5.99/month",
      features: [
        "Priority matching",
        "Unlimited messaging",
        "Save contacts",
        "No ads",
        "Advanced filters",
        "50 free coins monthly",
      ],
      current:
        userData.isPremium && userData.subscriptionType === "premium-monthly",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    },
    {
      id: "premium-yearly",
      name: "Premium Yearly",
      price: "$49.99/year",
      features: [
        "All Premium features",
        "30% savings vs monthly",
        "100 free coins monthly",
        "Premium badge",
      ],
      current:
        userData.isPremium && userData.subscriptionType === "premium-yearly",
      bestValue: true,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID,
    },
    {
      id: "creator",
      name: "Creator Plan",
      price: "$12.99/month",
      features: [
        "All Premium features",
        "Public streaming capability",
        "Pinned moments",
        "Custom profile themes",
        "Analytics dashboard",
        "150 free coins monthly",
      ],
      current: userData.isPremium && userData.subscriptionType === "creator",
      priceId: process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID,
    },
  ];

  useEffect(() => {
    if (user && !isLoading) {
      // In a real app, you would fetch the user data from Firestore
      setUserData({
        country: user.country || "",
        allowInternationalMatching: user.allowInternationalMatching !== false,
        isPremium: user.isPremium || false,
        displayName: user.displayName || "",
        subscriptionType: user.subscriptionType || "",
      });

      // Load user coins
      loadUserCoins(user.uid);
    }
  }, [user, isLoading, loadUserCoins]);

  // Watch for online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online");
      setOfflineStatus(false);
      if (user) {
        loadUserCoins(user.uid);
      }
    };

    const handleOffline = () => {
      console.log("App is offline");
      setOfflineStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, loadUserCoins, setOfflineStatus]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update user document in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        country: userData.country,
        allowInternationalMatching: userData.allowInternationalMatching,
        // Don't update premium status here - that would be handled by the payment system
      });

      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubscribeClick = (planId: string) => {
    const selectedPlan = plans.find((plan) => plan.id === planId);
    if (!selectedPlan || !selectedPlan.priceId) {
      toast({
        title: "Subscription Error",
        description: "Failed to find plan details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // In a production app, redirect to checkout page with the selected plan
    router.push(`/subscription?plan=${planId}&priceId=${selectedPlan.priceId}`);
  };

  // Handle sign out with proper error handling
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Router will redirect in the useEffect when user becomes null
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out properly",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [signOut, toast]);

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");
  const highlightedCardBg = useColorModeValue("blue.50", "blue.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (isLoading) {
    return (
      <Layout>
        <VStack spacing={8} w="full" pt={4}>
          <Skeleton height="100px" width="100%" />
          <Skeleton height="300px" width="100%" />
          <Skeleton height="200px" width="100%" />
        </VStack>
      </Layout>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <Layout>
      <Container maxW="md" py={8}>
        {/* Show error message if present */}
        {errorMessage && !isOffline && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Box>
            <Button
              size="sm"
              leftIcon={<ExclamationCircleIcon width={14} height={14} />}
              ml="auto"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </Alert>
        )}

        <VStack spacing={8} align="stretch">
          <VStack spacing={4} align="center">
            <Avatar
              size="xl"
              name={userData.displayName || user.email}
              src={user.photoURL || undefined}
              bg="blue.500"
            />
            <Heading size="md">{userData.displayName || user.email}</Heading>
            <HStack spacing={2}>
              {userData.isPremium && (
                <Badge
                  colorScheme="yellow"
                  px={2}
                  py={1}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                >
                  <SparklesIcon
                    width={16}
                    height={16}
                    style={{ marginRight: "4px" }}
                  />
                  Premium
                </Badge>
              )}
              <Badge
                colorScheme="blue"
                px={2}
                py={1}
                borderRadius="full"
                display="flex"
                alignItems="center"
              >
                <CurrencyDollarIcon
                  width={16}
                  height={16}
                  style={{ marginRight: "4px" }}
                />
                {coinsLoading ? "..." : coins} Coins
              </Badge>
            </HStack>
          </VStack>

          {/* Coins Summary Box */}
          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ delay: 0.05 } as any}
            p={6}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
            textAlign="center"
          >
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="md" mb={1}>
                  Loopin Coins
                  {isOffline && (
                    <Badge ml={2} colorScheme="yellow" variant="subtle">
                      Offline Mode
                    </Badge>
                  )}
                </Heading>
                <Stat>
                  <StatNumber
                    fontSize="2xl"
                    fontWeight="bold"
                    color="yellow.400"
                  >
                    {coinsLoading ? (
                      <Skeleton height="1.5rem" width="4rem" />
                    ) : (
                      `${coins} 🪙`
                    )}
                  </StatNumber>
                  <StatHelpText>
                    {isOffline
                      ? "Using cached data - Connect to update"
                      : "Available to spend"}
                  </StatHelpText>
                </Stat>
              </Box>
              <Button
                rightIcon={
                  isOffline ? (
                    <WifiIcon width={16} height={16} />
                  ) : (
                    <ArrowRightIcon width={16} height={16} />
                  )
                }
                colorScheme={isOffline ? "yellow" : "blue"}
                size="sm"
                onClick={() =>
                  isOffline ? loadUserCoins(user.uid) : router.push("/coins")
                }
              >
                {isOffline ? "Retry" : "Get More"}
              </Button>
            </Flex>
          </Box>

          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ delay: 0.1 } as any}
            p={6}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
          >
            <Heading size="md" mb={4}>
              Profile Settings
            </Heading>

            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Country</FormLabel>
                <Select
                  placeholder="Select country"
                  value={userData.country}
                  onChange={(e) =>
                    setUserData({ ...userData, country: e.target.value })
                  }
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="international-matching" mb="0">
                  Allow international matching
                </FormLabel>
                <Switch
                  id="international-matching"
                  isChecked={userData.allowInternationalMatching}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      allowInternationalMatching: e.target.checked,
                    })
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="color-mode" mb="0">
                  Dark mode
                </FormLabel>
                <Switch
                  id="color-mode"
                  isChecked={colorMode === "dark"}
                  onChange={toggleColorMode}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                isLoading={isSaving}
                onClick={handleSaveProfile}
                mt={2}
              >
                Save Settings
              </Button>
            </VStack>
          </Box>

          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ delay: 0.2 } as any}
            p={6}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
          >
            <Heading size="md" mb={4}>
              Subscription
            </Heading>

            <VStack spacing={4} align="stretch">
              {plans.map((plan) => (
                <Flex
                  key={plan.id}
                  p={4}
                  direction={{ base: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ base: "flex-start", sm: "center" }}
                  bg={plan.current ? highlightedCardBg : "transparent"}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  position="relative"
                  overflow="hidden"
                >
                  {plan.bestValue && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="yellow"
                    >
                      Best Value
                    </Badge>
                  )}
                  {plan.current && (
                    <Badge
                      position="absolute"
                      top={2}
                      right={plan.bestValue ? 10 : 2}
                      colorScheme="green"
                    >
                      Current
                    </Badge>
                  )}
                  <Box>
                    <Text fontWeight="bold">{plan.name}</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {plan.price}
                    </Text>
                    <VStack align="start" spacing={1} mt={2}>
                      {plan.features.map((feature, idx) => (
                        <Text key={idx} fontSize="sm">
                          • {feature}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                  <Button
                    mt={{ base: 4, sm: 0 }}
                    colorScheme={plan.current ? "gray" : "blue"}
                    size="sm"
                    onClick={() => handleSubscribeClick(plan.id)}
                    disabled={plan.current}
                  >
                    {plan.current ? "Current Plan" : "Subscribe"}
                  </Button>
                </Flex>
              ))}
            </VStack>
          </Box>

          <Box
            as={motion.div}
            initial={{ y: 20, opacity: 0 } as any}
            animate={{ y: 0, opacity: 1 } as any}
            transition={{ delay: 0.3 } as any}
            p={6}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
          >
            <Heading size="md" mb={4}>
              Account
            </Heading>
            <Button
              colorScheme="red"
              variant="outline"
              w="full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default ProfilePage;
