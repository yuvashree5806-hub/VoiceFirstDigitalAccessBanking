package com.falcon.api.service;

import com.falcon.api.dto.UserDTO;
import com.falcon.api.model.User;
import com.falcon.api.repository.UserRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public UserDTO createUser(UserDTO userDTO) {
        if (userRepository.existsByPhoneNumber(userDTO.getPhoneNumber())) {
            throw new RuntimeException("Phone number already registered");
        }
        User user = new User();
        BeanUtils.copyProperties(userDTO, user);
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        BeanUtils.copyProperties(user, dto);
        dto.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        return dto;
    }
}
