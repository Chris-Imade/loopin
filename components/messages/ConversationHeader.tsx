import React from "react";
import {
  Box,
  Flex,
  Text,
  Avatar,
  IconButton,
  Badge,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
} from "@chakra-ui/react";
import {
  IoEllipsisVertical,
  IoCall,
  IoVideocam,
  IoPerson,
  IoTrash,
  IoVolumeMute,
  IoFlag,
} from "react-icons/io5";
import { Contact } from "./ContactCard";

interface ConversationHeaderProps {
  contact: Contact;
  onVideoCall?: () => void;
  onAudioCall?: () => void;
  onViewProfile?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  contact,
  onVideoCall,
  onAudioCall,
  onViewProfile,
}) => {
  const { name, avatar, online } = contact;

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      py={3}
      px={4}
      borderBottom="1px"
      borderColor={borderColor}
      bg={bgColor}
      position="sticky"
      top={0}
      zIndex={1}
    >
      <Flex justify="space-between" align="center">
        <Flex align="center">
          <Box position="relative">
            <Avatar size="md" name={name} src={avatar} />
            {online && (
              <Badge
                position="absolute"
                bottom="0"
                right="0"
                borderRadius="full"
                bg="green.400"
                boxSize="12px"
                border="2px solid"
                borderColor={useColorModeValue("white", "gray.800")}
              />
            )}
          </Box>

          <Box ml={3}>
            <Text fontWeight="bold">{name}</Text>
            <Text fontSize="sm" color={online ? "green.500" : "gray.500"}>
              {online ? "Online" : "Offline"}
            </Text>
          </Box>
        </Flex>

        <Flex>
          <IconButton
            aria-label="Audio call"
            icon={<IoCall />}
            variant="ghost"
            colorScheme="blue"
            size="md"
            onClick={onAudioCall}
            mr={2}
          />

          <IconButton
            aria-label="Video call"
            icon={<IoVideocam />}
            variant="ghost"
            colorScheme="blue"
            size="md"
            onClick={onVideoCall}
            mr={2}
          />

          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<IoEllipsisVertical />}
              variant="ghost"
              colorScheme="blue"
              size="md"
            />
            <MenuList>
              <MenuItem icon={<IoPerson />} onClick={onViewProfile}>
                View Profile
              </MenuItem>
              <MenuItem icon={<IoVolumeMute />}>Mute Notifications</MenuItem>
              <Divider />
              <MenuItem icon={<IoFlag />} color="orange.500">
                Report User
              </MenuItem>
              <MenuItem icon={<IoTrash />} color="red.500">
                Delete Conversation
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};
