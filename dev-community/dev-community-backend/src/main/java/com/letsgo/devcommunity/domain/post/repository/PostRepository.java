package com.letsgo.devcommunity.domain.post.repository;

import com.letsgo.devcommunity.domain.post.entity.Post;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@Transactional
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByUserId(Long userId);

    List<Post> findAllByIdIn(List<Long> postIds);
}
