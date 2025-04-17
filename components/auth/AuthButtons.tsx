
import { Button, VStack, HStack, Icon, Text, Divider } from '@chakra-ui/react';
import { FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { useUserStore } from '../../store/userStore';

export const AuthButtons = () => {
  const { signInWithGoogle, signInWithFacebook, signInWithApple } = useUserStore();

  return (
    <VStack spacing={4} w="full" maxW="md">
      <Button
        w="full"
        leftIcon={<Icon as={FaGoogle} />}
        onClick={signInWithGoogle}
        colorScheme="red"
        variant="outline"
      >
        Continue with Google
      </Button>
      
      <Button
        w="full"
        leftIcon={<Icon as={FaFacebook} />}
        onClick={signInWithFacebook}
        colorScheme="facebook"
        variant="outline"
      >
        Continue with Facebook
      </Button>
      
      <Button
        w="full"
        leftIcon={<Icon as={FaApple} />}
        onClick={signInWithApple}
        variant="outline"
      >
        Continue with Apple
      </Button>

      <HStack w="full">
        <Divider />
        <Text fontSize="sm" color="gray.400" whiteSpace="nowrap">
          or
        </Text>
        <Divider />
      </HStack>

      <Button
        w="full"
        leftIcon={<Icon as={MdEmail} />}
        onClick={() => window.location.href = '/auth/email'}
        colorScheme="blue"
      >
        Sign in with Email
      </Button>
    </VStack>
  );
};
